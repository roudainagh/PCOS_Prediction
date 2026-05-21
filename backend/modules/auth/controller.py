from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from .schemas import SignupRequest, LoginRequest
from .service import AuthService

from datetime import datetime, timedelta
from .dependencies import admin_required, get_current_user
from sqlalchemy.orm import Session
from .models import User

from ..pcos.models import SymptomsAssessment, ClinicalAssessment


router = APIRouter(prefix="/auth", tags=["Auth"])

service = AuthService()


@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    try:
        return service.signup(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        token = service.login(db, data)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    

@router.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):
    return db.query(User).all()



@router.get("/admin/users/last-month")
def get_last_month_users(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    one_month_ago = datetime.utcnow() - timedelta(days=30)

    users = db.query(User).filter(User.created_at >= one_month_ago).all()

    return users

# Add this to your auth router
@router.get("/me")
def get_current_user(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "username": current_user.username,
        "location": current_user.location,
        "is_admin": current_user.is_admin,
        "id": current_user.id
    }


# ── Admin ────────────────────────────────────────────────────────────


@router.get("/admin/stats/symptoms")
def get_all_symptoms(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):
    return db.query(SymptomsAssessment).all()

@router.get("/admin/stats/clinical")
def get_all_clinical(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):
    return db.query(ClinicalAssessment).all()