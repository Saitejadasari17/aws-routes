import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def generate_id():
    return str(uuid.uuid4())


def generate_zone_id():
    return "Z" + uuid.uuid4().hex[:12].upper()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_id)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    email = Column(String, nullable=True)
    account_id = Column(String, default=lambda: "".join([str(uuid.uuid4().int)[:12]]))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=generate_zone_id)
    name = Column(String, nullable=False, index=True)
    type = Column(String, default="Public")
    comment = Column(Text, default="")
    record_count = Column(Integer, default=2)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    records = relationship("Record", back_populates="hosted_zone", cascade="all, delete-orphan")


class Record(Base):
    __tablename__ = "records"

    id = Column(String, primary_key=True, default=generate_id)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    ttl = Column(Integer, default=300)
    routing_policy = Column(String, default="Simple")
    alias = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    hosted_zone = relationship("HostedZone", back_populates="records")
