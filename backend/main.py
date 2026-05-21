from fastapi import FastAPI
from db.database import Base, engine, SessionLocal
from modules.auth.controller import router as auth_router
from modules.pcos.controller import router as pcos_router
from modules.chat.router import router as chat_router
from modules.auth.service import AuthService

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="PCOS API")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(pcos_router)
app.include_router(chat_router)


# 🟢 STARTUP EVENT
@app.on_event("startup")
def startup_event():
    try:
        db = SessionLocal()
        service = AuthService()

        # ✅ Only ensure tables exist (no drop)
        Base.metadata.create_all(bind=engine)

        # ✅ Create default admin if not exists
        service.create_default_admin(db)

        print("🚀 DB initialized, admin ensured")

    except Exception as e:
        print("Startup error:", e)

    finally:
        db.close()



# allow OPTIONS method
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Make sure OPTIONS is here
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)        