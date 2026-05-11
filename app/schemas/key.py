from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class KeyCreate(BaseModel):
    name: str
    rate_limit: int = 100
    expires_in_days: Optional[int] = None    # None = never expires

class KeyOut(BaseModel):
    id: int
    name: str
    key_prefix: str
    rate_limit: int
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class KeyCreated(KeyOut):
    raw_key: str