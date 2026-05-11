from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import APIKey, UsageLog, Project, User
from app.core.security import get_current_user

router = APIRouter(prefix="/projects/{project_id}/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    keys = db.query(APIKey).filter(APIKey.project_id == project_id).all()
    key_ids = [k.id for k in keys]
    total = db.query(func.count(UsageLog.id)).filter(UsageLog.api_key_id.in_(key_ids)).scalar()
    blocked = db.query(func.count(UsageLog.id)).filter(UsageLog.api_key_id.in_(key_ids), UsageLog.status == "blocked").scalar()
    per_key = [{"key_prefix": k.key_prefix, "name": k.name,
                "total_requests": db.query(func.count(UsageLog.id)).filter(UsageLog.api_key_id == k.id).scalar(),
                "last_used_at": k.last_used_at} for k in keys]
    return {"project": project.name, "total_requests": total, "blocked_requests": blocked,
            "allowed_requests": total - blocked, "keys": per_key}