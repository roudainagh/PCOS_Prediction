from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from .service import PCOSService
from .dependencies import get_current_user
from .lab_ocr import extract_clinical_from_images
from core.model_loader import clinical_feature_columns, clinical_feature_recipe
from .schemas import (
    SymptomsRequest, SymptomsResponse, ClinicalRequest, ClinicalResponse,
    SymptomsHistoryItem, ClinicalHistoryItem,   # add below
)
from .models import SymptomsAssessment, ClinicalAssessment, LabImage


router  = APIRouter(prefix="/pcos", tags=["PCOS"])
service = PCOSService()

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.get("/debug/encoding-maps")
def debug_maps():
    return {
        "feature_columns":    clinical_feature_columns,
        "log_transform_cols": clinical_feature_recipe["log_transform_cols"],
        "continuous_cols":    clinical_feature_recipe["continuous_cols"],
        "binary_cols":        clinical_feature_recipe["binary_cols"],
        "ordinal_cols":       clinical_feature_recipe["ordinal_cols"],
        "derived_features": {
            "FAI":                  clinical_feature_recipe["FAI"],
            "Follicle_Count_Total": clinical_feature_recipe["Follicle_Count_Total"],
            "Ovary_Volume_Total":   clinical_feature_recipe["Ovary_Volume_Total"],
        },
    }


@router.post("/symptoms", response_model=SymptomsResponse)
def symptoms_assessment(
    data: SymptomsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        record, message = service.assess_symptoms(db, current_user.id, data)
        return SymptomsResponse(
            id         = record.id,
            risk_score = record.risk_score,          # e.g. 0.734
            risk_label = record.risk_label,          # e.g. "High Risk"
            message    = message,
            created_at = record.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clinical", response_model=ClinicalResponse)
def clinical_assessment(
    data: ClinicalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        record, message = service.assess_clinical(db, current_user.id, data)
        return ClinicalResponse(
            id         = record.id,
            diagnosis  = record.diagnosis,
            message    = message,
            created_at = record.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clinical/image", response_model=ClinicalResponse)
async def clinical_assessment_from_image(
    files: List[UploadFile] = File(..., description="One or more lab report photos"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required.")

    images = []
    for f in files:
        media_type = f.content_type or "image/jpeg"
        if media_type not in ALLOWED_MIME:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{media_type}'. Upload JPEG, PNG, or WebP.",
            )
        raw = await f.read()
        images.append((raw, media_type, f.filename or "upload"))

    try:
        # images is list of (bytes, media_type, filename)
        clinical_data = extract_clinical_from_images([(b, mt) for b, mt, _ in images])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")

    try:
        record, message = service.assess_clinical(db, current_user.id, clinical_data)
        # ✅ Now persist the raw images linked to this assessment
        service.repo.save_lab_images(db, record.id, images)
        return ClinicalResponse(
            id         = record.id,
            diagnosis  = record.diagnosis,
            message    = message,
            created_at = record.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


# ── History ────────────────────────────────────────────────────────────


@router.get("/history/symptoms", response_model=list[SymptomsHistoryItem])
def symptoms_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    records = (
        db.query(SymptomsAssessment)
        .filter(SymptomsAssessment.user_id == current_user.id)
        .order_by(SymptomsAssessment.created_at.desc())
        .all()
    )
    return records


@router.get("/history/clinical", response_model=list[ClinicalHistoryItem])
def clinical_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    records = (
        db.query(ClinicalAssessment)
        .filter(ClinicalAssessment.user_id == current_user.id)
        .order_by(ClinicalAssessment.created_at.desc())
        .all()
    )
    return [
        ClinicalHistoryItem(
            **{c.name: getattr(r, c.name) for c in ClinicalAssessment.__table__.columns},
            image_count=len(r.images),
        )
        for r in records
    ]


@router.get("/history/clinical/{assessment_id}/images")
def get_assessment_images(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Returns metadata for images attached to a clinical assessment."""
    record = db.query(ClinicalAssessment).filter(
        ClinicalAssessment.id == assessment_id,
        ClinicalAssessment.user_id == current_user.id,   # user can only see their own
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return [
        {"id": img.id, "filename": img.filename, "media_type": img.media_type, "created_at": img.created_at}
        for img in record.images
    ]


@router.get("/history/clinical/images/{image_id}")
def download_lab_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Stream back a single lab image (ownership-checked)."""
    from fastapi.responses import Response
    img = db.query(LabImage).join(ClinicalAssessment).filter(
        LabImage.id == image_id,
        ClinicalAssessment.user_id == current_user.id,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=img.data, media_type=img.media_type)


