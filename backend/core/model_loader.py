import joblib

# ── Models ────────────────────────────────────────────────
symptoms_model  = joblib.load("models/best_symptoms_model.pkl")
clinical_model  = joblib.load("models/best_clinical_model.pkl")
selection_meta  = joblib.load("models/selection_meta.pkl")

# ── Symptoms encoders ─────────────────────────────────────
symptoms_feature_columns = joblib.load("models/encoders/symptoms_feature_columns.pkl")
symptoms_encoding_maps   = joblib.load("models/encoders/symptoms_encoding_maps.pkl")

# ── Clinical encoders ─────────────────────────────────────
clinical_feature_columns = joblib.load("models/encoders/clinical_feature_columns.pkl")
clinical_feature_recipe  = joblib.load("models/encoders/clinical_feature_recipe.pkl")
clinical_scaler          = joblib.load("models/encoders/clinical_scaler.pkl")