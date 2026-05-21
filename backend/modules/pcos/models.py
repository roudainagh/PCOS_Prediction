import os
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
from sqlalchemy.dialects.mysql import LONGBLOB


class LabImage(Base):
    __tablename__ = "lab_images"

    id                     = Column(Integer, primary_key=True, index=True)
    clinical_assessment_id = Column(Integer, ForeignKey("clinical_assessments.id"), nullable=False)
    filename               = Column(String(255))
    media_type             = Column(String(50))
    data                   = Column(LONGBLOB, nullable=False)   # LONGBLOB holds up to 4GB 
    created_at             = Column(DateTime, server_default=func.now())

    assessment = relationship("ClinicalAssessment", back_populates="images")


class SymptomsAssessment(Base):
    __tablename__ = "symptoms_assessments"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Physical
    weight_kg  = Column(Float)
    height_m   = Column(Float)
    bmi        = Column(Float)

    # Period
    period_type = Column(String(50))

    # Binary symptoms (0/1)
    overweight         = Column(Integer)
    excess_facial_hair = Column(Integer)
    excess_body_hair   = Column(Integer)
    dark_area          = Column(Integer)
    pimple_face        = Column(Integer)
    hormonal_acne_face = Column(Integer)
    fast_food          = Column(Integer)
    losing_hair        = Column(Integer)
    depress            = Column(Integer)
    mental_stress      = Column(Integer)
    insomnia           = Column(Integer)

    # Yes/No/IDK (0/1/2)
    family_background = Column(Integer)
    cyst_ovary        = Column(Integer)

    # Medical status (0/1/2)
    diabetes_measurment = Column(Integer)
    hormonal_imbalance  = Column(Integer)

    # Maybe (0/1/2)
    gain_weight   = Column(Integer)
    slow_activity = Column(Integer)

    # Mood (0/1/2/3)
    mood_swing_period = Column(Integer)
    craving_pt        = Column(Integer)

    # Other
    blood_pressure = Column(Integer)
    diagnosis_age  = Column(Integer)

    # Result
    risk_score = Column(Float)
    risk_label = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="symptoms_assessments")


class ClinicalAssessment(Base):
    __tablename__ = "clinical_assessments"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    fsh_miu_ml             = Column(Float)
    lh_miu_ml              = Column(Float)
    prolactin_ng_ml        = Column(Float)
    tsh_uiu_ml             = Column(Float)
    testosterone_ng_ml     = Column(Float)
    ovary_volume_left_cm3  = Column(Float)
    ovary_volume_right_cm3 = Column(Float)
    follicle_count_left    = Column(Float)
    follicle_count_right   = Column(Float)

    diagnosis  = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    user   = relationship("User", back_populates="clinical_assessments")
    images = relationship("LabImage", back_populates="assessment", cascade="all, delete-orphan")