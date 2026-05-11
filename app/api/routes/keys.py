from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from app.db.database import get_db
from app.db.models import APIKey, Project, User
from app.schemas.key import KeyCreate, KeyOut, KeyCreated
from app.core.security import get_current_user
from app.services.key_service import generate_api_key

router = APIRouter(prefix="/projects/{project_id}/keys", tags=["API Keys"])

def get_project_or_404(project_id: int, user: User, db: Session) -> Project:
    p = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    return p

@router.post("", response_model=KeyCreated, status_code=201)
def create_key(project_id: int, body: KeyCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_project_or_404(project_id, user, db)
    raw, prefix, hashed = generate_api_key()

    expires_at = None
    if body.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=body.expires_in_days)

    key = APIKey(
        name=body.name,
        key_prefix=prefix,
        hashed_key=hashed,
        project_id=project_id,
        rate_limit=body.rate_limit,
        expires_at=expires_at
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    return KeyCreated(**KeyOut.model_validate(key).model_dump(), raw_key=raw)

@router.get("", response_model=List[KeyOut])
def list_keys(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_project_or_404(project_id, user, db)
    return db.query(APIKey).filter(APIKey.project_id == project_id).all()

@router.delete("/{key_id}", status_code=204)
def revoke_key(project_id: int, key_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_project_or_404(project_id, user, db)
    key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.project_id == project_id).first()
    if not key:
        raise HTTPException(404, "Key not found")
    key.is_active = False
    db.commit()