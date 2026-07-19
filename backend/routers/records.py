from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import HostedZone, Record, User
from schemas import RecordCreate, RecordUpdate, RecordResponse, RecordListResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["records"])


def _get_zone(zone_id: str, db: Session) -> HostedZone:
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _sync_record_count(zone_id: str, db: Session):
    count = db.query(Record).filter(Record.hosted_zone_id == zone_id).count()
    db.query(HostedZone).filter(HostedZone.id == zone_id).update({"record_count": count})


@router.get("", response_model=RecordListResponse)
def list_records(
    zone_id: str,
    search: str = Query("", description="Search by name"),
    record_type: str = Query("", description="Filter by type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_zone(zone_id, db)
    query = db.query(Record).filter(Record.hosted_zone_id == zone_id)
    if search:
        query = query.filter(Record.name.ilike(f"%{search}%"))
    if record_type:
        query = query.filter(Record.type == record_type)
    total = query.count()
    records = query.order_by(Record.name, Record.type) \
                   .offset((page - 1) * page_size) \
                   .limit(page_size) \
                   .all()
    return RecordListResponse(
        records=[RecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_zone(zone_id, db)
    record = db.query(Record).filter(Record.id == record_id, Record.hosted_zone_id == zone_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return RecordResponse.model_validate(record)


@router.post("", response_model=RecordResponse, status_code=201)
def create_record(
    zone_id: str,
    body: RecordCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    zone = _get_zone(zone_id, db)
    record = Record(
        hosted_zone_id=zone_id,
        name=body.name,
        type=body.type,
        value=body.value,
        ttl=body.ttl,
        routing_policy=body.routing_policy,
        alias=body.alias,
    )
    db.add(record)
    _sync_record_count(zone_id, db)
    db.commit()
    db.refresh(record)
    return RecordResponse.model_validate(record)


@router.put("/{record_id}", response_model=RecordResponse)
def update_record(
    zone_id: str,
    record_id: str,
    body: RecordUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_zone(zone_id, db)
    record = db.query(Record).filter(Record.id == record_id, Record.hosted_zone_id == zone_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if body.value is not None:
        record.value = body.value
    if body.ttl is not None:
        record.ttl = body.ttl
    if body.routing_policy is not None:
        record.routing_policy = body.routing_policy
    if body.alias is not None:
        record.alias = body.alias
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return RecordResponse.model_validate(record)


@router.delete("/{record_id}")
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_zone(zone_id, db)
    record = db.query(Record).filter(Record.id == record_id, Record.hosted_zone_id == zone_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.type in ("SOA", "NS") and record.name.rstrip(".") == _get_zone(zone_id, db).name.rstrip("."):
        raise HTTPException(status_code=400, detail="Cannot delete zone apex SOA/NS records")
    db.delete(record)
    _sync_record_count(zone_id, db)
    db.commit()
    return {"message": "Record deleted"}
