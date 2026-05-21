from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from typing import Optional, List


# ── Shared type aliases ───────────────────────────────────

YesNo          = Literal["Yes", "No"]
YesNoIDK       = Literal["Yes", "No", "I do not know"]
NormalAbnormal = Literal["Normal", "Abnormal", "I do not know"]
MaybeLiteral   = Literal["No", "May be", "Yes"]
MoodLevel      = Literal["Normal", "Medium", "High", "Extreme"]
BloodPressure  = Literal["Low", "Normal", "High"]
DiagAge        = Literal["Youth", "Young adult", "adult"]
PeriodType     = Literal["Regular", "Irregular", "No period"]


# ── Symptoms ──────────────────────────────────────────────

class SymptomsRequest(BaseModel):

    # ── Numerical ──────────────────────────────────────────
    weight_kg: float = Field(..., gt=20, lt=300, description="Weight in kg")
    height_m:  float = Field(..., gt=1.0, lt=2.5, description="Height in meters")
    bmi:       float = Field(..., gt=10,  lt=80,  description="BMI (kg/m²)")

    # ── Period ─────────────────────────────────────────────
    period_type: PeriodType = Field(..., description="Menstrual cycle pattern")

    # ── Binary Yes/No ──────────────────────────────────────
    overweight:         YesNo = Field(..., description="Do you consider yourself overweight?")
    excess_facial_hair: YesNo = Field(..., description="Excess hair on face?")
    excess_body_hair:   YesNo = Field(..., description="Excess hair on body?")
    dark_area:          YesNo = Field(..., description="Dark skin patches (neck, armpits)?")
    pimple_face:        YesNo = Field(..., description="Pimples on face?")
    hormonal_acne_face: YesNo = Field(..., description="Hormonal acne?")
    fast_food:          YesNo = Field(..., description="Do you eat fast food regularly?")
    losing_hair:        YesNo = Field(..., description="Hair thinning or loss?")
    depress:            YesNo = Field(..., description="Feeling depressed?")
    mental_stress:      YesNo = Field(..., description="High mental stress?")
    insomnia:           YesNo = Field(..., description="Trouble sleeping?")

    # ── Yes/No/IDK ────────────────────────────────────────
    family_background: YesNoIDK = Field(..., description="Family history of PCOS?")
    cyst_ovary:        YesNoIDK = Field(..., description="Diagnosed with ovarian cysts?")

    # ── User-reported medical ──────────────────────────────
    diabetes_measurment: NormalAbnormal = Field(..., description="Blood sugar / diabetes status")
    hormonal_imbalance:  NormalAbnormal = Field(..., description="Known hormonal imbalance?")

    # ── Maybe group ───────────────────────────────────────
    gain_weight:   MaybeLiteral = Field(..., description="Unexplained weight gain?")
    slow_activity: MaybeLiteral = Field(..., description="Feeling slow or low energy?")

    # ── Mood ──────────────────────────────────────────────
    mood_swing_period: MoodLevel = Field(..., description="Mood swings severity")
    craving_pt:        MoodLevel = Field(..., description="Cravings severity")

    # ── Other ordinal ─────────────────────────────────────
    blood_pressure: BloodPressure = Field(..., description="Blood pressure level")
    diagnosis_age:  DiagAge       = Field(..., description="Age group")


class SymptomsResponse(BaseModel):
    id:          int
    risk_score:  float   # continuous 0.0–1.0, displayed as percentage
    risk_label:  str     # "Low Risk" | "Medium Risk" | "High Risk"
    message:     str
    created_at:  datetime

    class Config:
        from_attributes = True


# ── Clinical ──────────────────────────────────────────────

class ClinicalRequest(BaseModel):

    # ── From lab report ────────────────────────────────────
    fsh_miu_ml:         float = Field(..., description="FSH (mIU/mL)")
    lh_miu_ml:          float = Field(..., description="LH (mIU/mL)")
    prolactin_ng_ml:    float = Field(..., description="Prolactin (ng/mL)")
    tsh_uiu_ml:         float = Field(..., description="TSH (μIU/mL)")
    testosterone_ng_ml: float = Field(..., description="Testosterone (ng/mL)")

    # ── Ultrasound — optional, default 0 if not done ───────
    ovary_volume_left_cm3:  float = Field(default=0.0, description="Left ovary volume (cm³)")
    ovary_volume_right_cm3: float = Field(default=0.0, description="Right ovary volume (cm³)")
    follicle_count_left:    float = Field(default=0.0)
    follicle_count_right:   float = Field(default=0.0)


class ClinicalResponse(BaseModel):
    id:         int
    diagnosis:  str
    message:    str
    created_at: datetime

    class Config:
        from_attributes = True




# ── History ──────────────────────────────────────────────

class SymptomsHistoryItem(BaseModel):
    id:         int
    risk_score: float
    risk_label: str
    created_at: datetime

    # Physical
    weight_kg: float
    height_m:  float
    bmi:       float

    # Period
    period_type: str

    # Binary (stored as 0/1)
    overweight:         int
    excess_facial_hair: int
    excess_body_hair:   int
    dark_area:          int
    pimple_face:        int
    hormonal_acne_face: int
    fast_food:          int
    losing_hair:        int
    depress:            int
    mental_stress:      int
    insomnia:           int

    # Yes/No/IDK (0/1/2)
    family_background: int
    cyst_ovary:        int

    # Medical (0/1/2)
    diabetes_measurment: int
    hormonal_imbalance:  int

    # Maybe (0/1/2)
    gain_weight:   int
    slow_activity: int

    # Mood (0/1/2/3)
    mood_swing_period: int
    craving_pt:        int

    # Other
    blood_pressure: int
    diagnosis_age:  int

    class Config:
        from_attributes = True


class ClinicalHistoryItem(BaseModel):
    id:                    int
    diagnosis:             str
    fsh_miu_ml:            float
    lh_miu_ml:             float
    prolactin_ng_ml:       float
    tsh_uiu_ml:            float
    testosterone_ng_ml:    float
    image_count:           int     # how many images were attached
    created_at:            datetime

    class Config:
        from_attributes = True