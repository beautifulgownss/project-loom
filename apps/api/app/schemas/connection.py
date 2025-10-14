"""Connection schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class ConnectionBase(BaseModel):
    """Base connection schema."""
    provider: str  # 'resend' or 'gmail'
    provider_email: EmailStr


class ConnectionCreate(ConnectionBase):
    """Schema for creating a connection."""
    credentials: Optional[dict] = None


class ConnectionUpdate(BaseModel):
    """Schema for updating a connection."""
    status: Optional[str] = None
    credentials: Optional[dict] = None


class ConnectionResponse(ConnectionBase):
    """Schema for connection response."""
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
