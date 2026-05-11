from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import APIKey, UsageLog, Notification
from app.services.key_service import hash_key
from app.core.rate_limiter import is_rate_limited

router = APIRouter(prefix="/validate", tags=["Validate"])

class ValidateRequest(BaseModel):
    api_key: str
    endpoint: str = "unknown"

@router.post("")
async def validate_key(body: ValidateRequest, db: Session = Depends(get_db)):
    hashed = hash_key(body.api_key)
    key = db.query(APIKey).filter(APIKey.hashed_key == hashed, APIKey.is_active == True).first()

    if not key:
        raise HTTPException(401, "Invalid or revoked API key")

    # Check expiry
    if key.expires_at and datetime.now(timezone.utc) > key.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(401, detail={
            "error": "API key expired",
            "expired_at": str(key.expires_at)
        })

    # Check rate limit
    limited = await is_rate_limited(key.id, key.rate_limit)
    status = "blocked" if limited else "ok"

    # Log usage
    log = UsageLog(api_key_id=key.id, endpoint=body.endpoint, status=status)
    db.add(log)
    key.last_used_at = datetime.now(timezone.utc)

    # Create notification if rate limited
    if limited:
        notification = Notification(
            user_id=key.project.owner_id,
            project_id=key.project_id,
            api_key_id=key.id,
            message=f"Rate limit exceeded for key '{key.name}' ({key.key_prefix}) on endpoint '{body.endpoint}'. Limit: {key.rate_limit} req/min."
        )
        db.add(notification)

    db.commit()

    if limited:
        raise HTTPException(429, detail={
            "error": "Rate limit exceeded",
            "limit": key.rate_limit,
            "window": "60 seconds"
        })

    return {
        "valid": True,
        "key_prefix": key.key_prefix,
        "project_id": key.project_id,
        "expires_at": str(key.expires_at) if key.expires_at else "never"
    }