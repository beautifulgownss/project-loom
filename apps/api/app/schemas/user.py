"""User schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    auth_provider: str
    auth_id: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    auth_provider: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
