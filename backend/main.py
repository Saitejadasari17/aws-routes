from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.hash import bcrypt

from database import engine, SessionLocal, Base
from models import User
from routers import auth, zones, records

# Create tables
Base.metadata.create_all(bind=engine)


def seed_default_user():
    """Create a default admin user if none exists."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            user = User(
                username="admin",
                password_hash=bcrypt.hash("admin123"),
                email="admin@example.com",
                account_id="123456789012",
            )
            db.add(user)
            db.commit()
    except Exception as e:
        print(f"Seed warning: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_default_user()
    yield


app = FastAPI(title="Route53 Clone API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
