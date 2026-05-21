from sqlalchemy.orm import Session
from .models import SymptomsAssessment, ClinicalAssessment, LabImage


class PCOSRepository:

    def save_symptoms(self, db: Session, record: SymptomsAssessment):
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def save_clinical(self, db: Session, record: ClinicalAssessment):
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def save_lab_images(
        self,
        db: Session,
        clinical_assessment_id: int,
        images: list[tuple[bytes, str, str]],  # (data, media_type, filename)
    ):
        records = [
            LabImage(
                clinical_assessment_id=clinical_assessment_id,
                filename=filename,
                media_type=media_type,
                data=data,
            )
            for data, media_type, filename in images
        ]
        db.add_all(records)
        db.commit()
        return records