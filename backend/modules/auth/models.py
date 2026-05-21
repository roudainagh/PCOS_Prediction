from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50))
    email           = Column(String(100), unique=True, index=True)
    location        = Column(String(100))
    hashed_password = Column(String(255))
    is_admin        = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    symptoms_assessments = relationship("SymptomsAssessment", back_populates="user")
    clinical_assessments = relationship("ClinicalAssessment", back_populates="user")