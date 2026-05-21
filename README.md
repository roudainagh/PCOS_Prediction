# PCOS Detect

An AI-powered web app for PCOS detection and hormonal risk assessment — built with FastAPI, React, and machine learning.

---

## What It Does

- **Risk Prediction** — Predicts hormonal risk level using regression models trained on lab and clinical data
- **PCOS Classification** — Predicts whether a patient has PCOS or not using classification models
- **Test Tracking** — Users can log, manage, and monitor their medical tests over time
- **Doctor Recommendations** — Personalized suggestions based on model output and test history
- **AI Chatbot** — Conversational assistant for guidance and Q&A

---

## ML Models

### Regression (Risk Level Prediction)
Three models trained and compared; best performer integrated:
- Ridge Regression
- Random Forest Regressor
- XGBoost Regressor

### Classification (PCOS Detection)
Three models trained and compared; best performer integrated:
- Logistic Regression
- Random Forest Classifier
- XGBoost Classifier

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React |
| ML | XGBoost |
| Data | pandas, NumPy |

---

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---


## Features

- User authentication and personal test history
- Risk trend visualization over time
- Doctor recommendations based on results
- AI chatbot for health guidance
