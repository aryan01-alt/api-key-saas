from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.db.database import get_db
from app.db.models import ProjectMember, Project, User
from app.core.security import get_current_user

router = APIRouter(prefix="/projects/{project_id}/members", tags=["Members"])

class MemberOut(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    model_config = {"from_attributes": True}

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"

def get_project_or_404(project_id: int, user: User, db: Session) -> Project:
    p = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user.id
    ).first()
    if not p:
        raise HTTPException(404, "Project not found or you are not the owner")
    return p

@router.post("", status_code=201)
def invite_member(
    project_id: int,
    body: InviteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    get_project_or_404(project_id, user, db)

    # Find the user to invite
    invite_user = db.query(User).filter(User.email == body.email).first()
    if not invite_user:
        raise HTTPException(404, f"No user found with email {body.email}")

    # Can't invite yourself
    if invite_user.id == user.id:
        raise HTTPException(400, "You can't invite yourself")

    # Check if already a member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == invite_user.id
    ).first()
    if existing:
        raise HTTPException(409, "User is already a member of this project")

    member = ProjectMember(
        project_id=project_id,
        user_id=invite_user.id,
        role=body.role
    )
    db.add(member)
    db.commit()
    return {
        "message": f"{body.email} added to project",
        "role": body.role
    }

@router.get("", response_model=List[MemberOut])
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Both owner and members can view
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()

@router.delete("/{user_id}", status_code=200)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    get_project_or_404(project_id, user, db)
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member removed from project"}