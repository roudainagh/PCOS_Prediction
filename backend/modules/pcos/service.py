import math
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from core.model_loader import (
    symptoms_model, symptoms_feature_columns,
    clinical_model, clinical_feature_columns, clinical_feature_recipe,
)
from .repository import PCOSRepository
from .models import SymptomsAssessment, ClinicalAssessment
from .schemas import SymptomsRequest, ClinicalRequest

# ── Risk score → label thresholds (must match training notebook) ──────────────
RISK_THRESHOLDS = {"low": 0.33, "medium": 0.66}

def score_to_label(score: float) -> str:
    """Convert continuous [0, 1] risk score to display label."""
    if score < RISK_THRESHOLDS["low"]:
        return "Low Risk"
    elif score < RISK_THRESHOLDS["medium"]:
        return "Medium Risk"
    else:
        return "High Risk"

# ── Clinical population defaults ──────────────────────────────────────────────
CLINICAL_DEFAULTS = {
    "Age": 28.0, "Height_cm": 163.0, "Weight_kg": 65.0, "BMI": 24.5,
    "Waist_Circumference_cm": 78.0, "Hip_Circumference_cm": 96.0, "Waist_Hip_Ratio": 0.81,
    "Menstrual_Irregularity": 0, "Menstrual_Cycle_Length_days": 28.0, "Age_at_Menarche": 13,
    "Gravidity": 0, "Parity": 0,
    "Hirsutism_Score_FG": 2.0, "Acne_Severity": 1, "Alopecia": 0, "Skin_Darkening_Acanthosis": 0,
    "Blood_Pressure_Systolic": 115.0, "Blood_Pressure_Diastolic": 75.0, "Sleep_Hours": 7.0,
    "Physical_Activity_Level": 1, "Smoking_Status": 0, "Alcohol_Intake": 0, "Dietary_Sugar_Intake": 1,
    "Free_Testosterone_pg_mL": 5.0, "DHEAS_ug_dL": 150.0, "Estradiol_pg_mL": 80.0,
    "Progesterone_ng_mL": 1.5, "SHBG_nmol_L": 50.0,
    "Fasting_Glucose_mg_dL": 90.0, "Fasting_Insulin_uIU_mL": 8.0, "HOMA_IR": 1.8,
    "HbA1c_percent": 5.2, "Total_Cholesterol_mg_dL": 180.0, "HDL_mg_dL": 55.0,
    "LDL_mg_dL": 100.0, "Triglycerides_mg_dL": 100.0, "CRP_mg_L": 1.0,
    "ALT_U_L": 20.0, "AST_U_L": 22.0, "Vitamin_D_ng_mL": 25.0, "Hemoglobin_g_dL": 13.0,
}


class PCOSService:

    def __init__(self):
        self.repo = PCOSRepository()

    # ──────────────────────────────────────────────────────
    # SYMPTOMS
    # ──────────────────────────────────────────────────────

    def _encode_symptoms(self, data: SymptomsRequest) -> pd.DataFrame:
        row = {}

        # 1. Numerical
        row["Weight(kg)"]  = data.weight_kg
        row["Height(m)"]   = data.height_m
        row["BMI(kg/m*m)"] = data.bmi

        # 2. Period
        row["Period_type"] = {"Regular": 0, "Irregular": 1, "No period": 2}[data.period_type]

        # 3. Binary Yes/No → 1/0
        binary_map = {"Yes": 1, "No": 0}
        for col, val in {
            "Overweight":         data.overweight,
            "Excess_facial_hair": data.excess_facial_hair,
            "Excess_body_hair":   data.excess_body_hair,
            "Dark_area":          data.dark_area,
            "Pimple_face":        data.pimple_face,
            "Hormonal_acne_face": data.hormonal_acne_face,
            "Fast_food":          data.fast_food,
            "Losing_hair":        data.losing_hair,
            "Depress":            data.depress,
            "Mental_stress":      data.mental_stress,
            "Insomnia":           data.insomnia,
        }.items():
            row[col] = binary_map[val]

        # 4. Yes/No/IDK → 0/1/2
        idk_map = {"No": 0, "I do not know": 1, "Yes": 2}
        row["Family_background"] = idk_map[data.family_background]
        row["Cyst_ovary"]        = idk_map[data.cyst_ovary]

        # 5. Medical status → Normal=0, IDK=1, Abnormal=2
        med_map = {"Normal": 0, "I do not know": 1, "Abnormal": 2}
        row["Diabetes_measurment"] = med_map[data.diabetes_measurment]
        row["Hormonal_imbalance"]  = med_map[data.hormonal_imbalance]

        # 6. Lab hormones — user doesn't provide → default "I do not know" = 1
        for col in ["LH_hormone", "FSH_hormone", "TSH_hormone",
                    "Prolactin_hormone", "Hemoglobin_level"]:
            row[col] = 1

        # 7. Maybe → 0/1/2
        maybe_map = {"No": 0, "May be": 1, "Yes": 2}
        row["Gain_weight"]   = maybe_map[data.gain_weight]
        row["Slow_activity"] = maybe_map[data.slow_activity]

        # 8. Mood → 0/1/2/3
        mood_map = {"Normal": 0, "Medium": 1, "High": 2, "Extreme": 3}
        row["Mood_swing_period"] = mood_map[data.mood_swing_period]
        row["Craving_PT"]        = mood_map[data.craving_pt]

        # 9. Blood pressure → 0/1/2
        row["Blood_pressure"] = {"Low": 0, "Normal": 1, "High": 2}[data.blood_pressure]

        # 10. Diagnosis age → 0/1/2
        row["Diagnosis_age"] = {"Youth": 0, "Young adult": 1, "adult": 2}[data.diagnosis_age]

        df = pd.DataFrame([row])
        df = df.reindex(columns=symptoms_feature_columns, fill_value=0)
        return df

    def assess_symptoms(self, db: Session, user_id: int, data: SymptomsRequest):
        df = self._encode_symptoms(data)

        raw_score  = float(np.clip(symptoms_model.predict(df)[0], 0.0, 1.0))
        risk_label = score_to_label(raw_score)

        binary_map = {"Yes": 1, "No": 0}
        idk_map    = {"No": 0, "I do not know": 1, "Yes": 2}
        med_map    = {"Normal": 0, "I do not know": 1, "Abnormal": 2}
        maybe_map  = {"No": 0, "May be": 1, "Yes": 2}
        mood_map   = {"Normal": 0, "Medium": 1, "High": 2, "Extreme": 3}

        record = SymptomsAssessment(
            user_id = user_id,

            # Physical
            weight_kg = data.weight_kg,
            height_m  = data.height_m,
            bmi       = data.bmi,

            # Period
            period_type = data.period_type,

            # Binary
            overweight         = binary_map[data.overweight],
            excess_facial_hair = binary_map[data.excess_facial_hair],
            excess_body_hair   = binary_map[data.excess_body_hair],
            dark_area          = binary_map[data.dark_area],
            pimple_face        = binary_map[data.pimple_face],
            hormonal_acne_face = binary_map[data.hormonal_acne_face],
            fast_food          = binary_map[data.fast_food],
            losing_hair        = binary_map[data.losing_hair],
            depress            = binary_map[data.depress],
            mental_stress      = binary_map[data.mental_stress],
            insomnia           = binary_map[data.insomnia],

            # Yes/No/IDK
            family_background = idk_map[data.family_background],
            cyst_ovary        = idk_map[data.cyst_ovary],

            # Medical
            diabetes_measurment = med_map[data.diabetes_measurment],
            hormonal_imbalance  = med_map[data.hormonal_imbalance],

            # Maybe
            gain_weight   = maybe_map[data.gain_weight],
            slow_activity = maybe_map[data.slow_activity],

            # Mood
            mood_swing_period = mood_map[data.mood_swing_period],
            craving_pt        = mood_map[data.craving_pt],

            # Other
            blood_pressure = {"Low": 0, "Normal": 1, "High": 2}[data.blood_pressure],
            diagnosis_age  = {"Youth": 0, "Young adult": 1, "adult": 2}[data.diagnosis_age],

            # Result
            risk_score = raw_score,
            risk_label = risk_label,
        )

        saved = self.repo.save_symptoms(db, record)

        messages = {
            "Low Risk":    "Your symptoms suggest a low PCOS risk. Keep monitoring your health.",
            "Medium Risk": "Your symptoms suggest a moderate PCOS risk. Consider consulting a doctor.",
            "High Risk":   "Your symptoms suggest a high PCOS risk. Please consult a gynecologist soon.",
        }
        return saved, messages[risk_label]

    # ──────────────────────────────────────────────────────
    # CLINICAL
    # ──────────────────────────────────────────────────────

    def _preprocess_clinical(self, data: ClinicalRequest) -> pd.DataFrame:
        total_testosterone_ng_dl = data.testosterone_ng_ml * 100
        lh_fsh_ratio = data.lh_miu_ml / data.fsh_miu_ml if data.fsh_miu_ml > 0 else 0.0
        shbg = CLINICAL_DEFAULTS["SHBG_nmol_L"]

        row = dict(CLINICAL_DEFAULTS)
        row.update({
            "FSH_mIU_mL":               data.fsh_miu_ml,
            "LH_mIU_mL":                data.lh_miu_ml,
            "LH_FSH_Ratio":             lh_fsh_ratio,
            "Total_Testosterone_ng_dL": total_testosterone_ng_dl,
            "Prolactin_ng_mL":          data.prolactin_ng_ml,
            "TSH_uIU_mL":               data.tsh_uiu_ml,
            "SHBG_nmol_L":              shbg,
            "Ovary_Volume_Left_cm3":    data.ovary_volume_left_cm3,
            "Ovary_Volume_Right_cm3":   data.ovary_volume_right_cm3,
            "Follicle_Count_Left":      data.follicle_count_left,
            "Follicle_Count_Right":     data.follicle_count_right,
        })

        # Derived features
        row["FAI"]                  = total_testosterone_ng_dl / shbg * 100
        row["Follicle_Count_Total"] = data.follicle_count_left + data.follicle_count_right
        row["Ovary_Volume_Total"]   = data.ovary_volume_left_cm3 + data.ovary_volume_right_cm3

        df = pd.DataFrame([row])

        for col in clinical_feature_recipe["log_transform_cols"]:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: math.log1p(max(x, 0)))

        df = df.reindex(columns=clinical_feature_columns, fill_value=0)
        return df

    def assess_clinical(self, db: Session, user_id: int, data: ClinicalRequest):
        df         = self._preprocess_clinical(data)
        prediction = clinical_model.predict(df)[0]
        label      = "PCOS" if prediction == 1 else "No PCOS"

        record = ClinicalAssessment(
            user_id                = user_id,
            fsh_miu_ml             = data.fsh_miu_ml,
            lh_miu_ml              = data.lh_miu_ml,
            prolactin_ng_ml        = data.prolactin_ng_ml,
            tsh_uiu_ml             = data.tsh_uiu_ml,
            testosterone_ng_ml     = data.testosterone_ng_ml,
            ovary_volume_left_cm3  = data.ovary_volume_left_cm3,
            ovary_volume_right_cm3 = data.ovary_volume_right_cm3,
            follicle_count_left    = data.follicle_count_left,
            follicle_count_right   = data.follicle_count_right,
            diagnosis              = label,
        )

        saved = self.repo.save_clinical(db, record)
        messages = {
            "PCOS":    "Clinical data indicates PCOS. Please consult a specialist for confirmation.",
            "No PCOS": "Clinical data does not indicate PCOS. Continue regular check-ups.",
        }
        return saved, messages[label]