from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.db.models import Notification, User
from app.core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationOut(BaseModel):
    id: int
    project_id: int
    api_key_id: int
    message: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}

@router.get("", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).all()

@router.patch("/{notification_id}/read", status_code=200)
def mark_as_read(notification_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id
    ).first()
    if not notification:
        return {"message": "Notification not found"}
    notification.is_read = True
    db.commit()
    return {"message": "Marked as read"}

@router.patch("/read-all", status_code=200)
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}