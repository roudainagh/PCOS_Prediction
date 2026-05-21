from passlib.context import CryptContext
from .repository import AuthRepository
from datetime import datetime
from .models import User
from core.security import create_token
from core.config import ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:

    def __init__(self):
        self.repo = AuthRepository()

    def hash_password(self, password: str):
        return pwd_context.hash(password)

    def verify_password(self, plain, hashed):
        return pwd_context.verify(plain, hashed)

    def signup(self, db, data):

        if len(data.password) < 6:
            raise Exception("Password must contain at least 6 characters")

        if data.password != data.confirm_password:
            raise Exception("Passwords do not match")

        existing = self.repo.get_by_email(db, data.email)
        if existing:
            raise Exception("Email already exists")

        user = User(
            username=data.username,
            email=data.email,
            location=data.location,
            hashed_password=self.hash_password(data.password),

            # 🆕 automatically set (you can also omit because default exists)
            created_at=datetime.utcnow(),

            # default user is NOT admin
            is_admin=False
        )

        return self.repo.create_user(db, user)

    def login(self, db, data):

        user = self.repo.get_by_email(db, data.email)

        if not user or not self.verify_password(data.password, user.hashed_password):
            raise Exception("Invalid credentials")

        token = create_token({"sub": user.email})

        return token
    

    def create_default_admin(self, db):

        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if existing:
            return

        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            location="SYSTEM",
            hashed_password=self.hash_password(ADMIN_PASSWORD),
            is_admin=True
        )

        db.add(admin)
        db.commit()