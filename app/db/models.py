from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), unique=True, index=True, nullable=False)
    hashed_pass  = Column(String(255), nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    projects     = relationship("Project", back_populates="owner", cascade="all, delete")

class Project(Base):
    __tablename__ = "projects"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    description = Column(String(500))
    owner_id    = Column(Integer, ForeignKey("users.id"))
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    owner       = relationship("User", back_populates="projects")
    api_keys    = relationship("APIKey", back_populates="project", cascade="all, delete")

class APIKey(Base):
    __tablename__ = "api_keys"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)
    key_prefix   = Column(String(20), nullable=False)
    hashed_key   = Column(String(255), unique=True, nullable=False)
    project_id   = Column(Integer, ForeignKey("projects.id"))
    rate_limit   = Column(Integer, default=100)
    is_active    = Column(Boolean, default=True)
    expires_at   = Column(DateTime, nullable=True)
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime, nullable=True)
    project      = relationship("Project", back_populates="api_keys")
    logs         = relationship("UsageLog", back_populates="api_key", cascade="all, delete")

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id         = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"))
    endpoint   = Column(String(255))
    status     = Column(String(10))           # "ok" or "blocked"
    timestamp  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    api_key    = relationship("APIKey", back_populates="logs")
    
class Notification(Base):
    __tablename__ = "notifications"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    project_id  = Column(Integer, ForeignKey("projects.id"))
    api_key_id  = Column(Integer, ForeignKey("api_keys.id"))
    message     = Column(String(500), nullable=False)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))    
    
class ProjectMember(Base):
    __tablename__ = "project_members"
    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    role       = Column(String(20), default="member")
    joined_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))    
    