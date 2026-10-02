import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app import models as _app_models
from app.models.user import User

TEST_DB_FILE = "/tmp/test_area_de_membros.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except Exception:
        pass

SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        superadmin = User(
            email=settings.SUPERADMIN_EMAIL,
            name=settings.SUPERADMIN_NAME,
            hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
            role="superadmin",
            is_active=True
        )
        db.add(superadmin)
        db.commit()
    finally:
        db.close()

    yield

    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            try:
                db.execute(table.delete())
            except Exception:
                pass
        db.commit()
    finally:
        db.close()

client = TestClient(app)

