from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    account_id: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


# Hosted Zones
class HostedZoneCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = Field(default="Public")
    comment: Optional[str] = ""


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None


class HostedZoneResponse(BaseModel):
    id: str
    name: str
    type: str
    comment: str
    record_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HostedZoneListResponse(BaseModel):
    zones: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int


# Records
class RecordCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str
    value: str
    ttl: int = Field(default=300, ge=0, le=2147483647)
    routing_policy: str = Field(default="Simple")
    alias: bool = False


class RecordUpdate(BaseModel):
    value: Optional[str] = None
    ttl: Optional[int] = None
    routing_policy: Optional[str] = None
    alias: Optional[bool] = None


class RecordResponse(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    routing_policy: str
    alias: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordListResponse(BaseModel):
    records: List[RecordResponse]
    total: int
    page: int
    page_size: int
