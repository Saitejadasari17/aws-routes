from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import HostedZone, Record, User
from schemas import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZoneListResponse,
)
from routers.auth import get_current_user

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


@router.get("", response_model=HostedZoneListResponse)
def list_zones(
    search: str = Query("", description="Search by name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(HostedZone)
    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))
    total = query.count()
    zones = query.order_by(HostedZone.created_at.desc()) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()
    return HostedZoneListResponse(
        zones=[HostedZoneResponse.model_validate(z) for z in zones],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return HostedZoneResponse.model_validate(zone)


@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_zone(
    body: HostedZoneCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Normalize domain name
    name = body.name.strip().rstrip(".") + "."
    zone = HostedZone(name=name, type=body.type, comment=body.comment or "", record_count=2)
    db.add(zone)
    db.flush()

    # Auto-create SOA and NS records
    ns_record = Record(
        hosted_zone_id=zone.id,
        name=name,
        type="NS",
        value="ns-001.awsdns-01.com.\nns-002.awsdns-02.net.\nns-003.awsdns-03.org.\nns-004.awsdns-04.co.uk.",
        ttl=172800,
    )
    soa_record = Record(
        hosted_zone_id=zone.id,
        name=name,
        type="SOA",
        value=f"ns-001.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        ttl=900,
    )
    db.add(ns_record)
    db.add(soa_record)
    db.commit()
    db.refresh(zone)
    return HostedZoneResponse.model_validate(zone)


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_zone(
    zone_id: str,
    body: HostedZoneUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    if body.comment is not None:
        zone.comment = body.comment
    zone.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(zone)
    return HostedZoneResponse.model_validate(zone)


@router.delete("/{zone_id}")
def delete_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return {"message": "Hosted zone deleted"}
