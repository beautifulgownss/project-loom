"""Follow-up job schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional


class FollowUpJobBase(BaseModel):
    """Base follow-up job schema."""
    original_recipient: EmailStr
    original_subject: str
    original_body: Optional[str] = None
    delay_hours: int = Field(default=24, ge=1, le=168)  # 1 hour to 1 week
    tone: str = Field(default="professional", pattern="^(professional|friendly|urgent)$")
    max_followups: int = Field(default=1, ge=1, le=5)
    stop_on_reply: bool = True


class FollowUpJobCreate(FollowUpJobBase):
    """Schema for creating a follow-up job."""
    connection_id: Optional[int] = None  # If not provided, uses user's first active connection
    original_message_id: Optional[str] = None


class FollowUpJobUpdate(BaseModel):
    """Schema for updating a follow-up job."""
    status: Optional[str] = None
    draft_subject: Optional[str] = None
    draft_body: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    reply_received_at: Optional[datetime] = None
    error_message: Optional[str] = None


class FollowUpJobResponse(FollowUpJobBase):
    """Schema for follow-up job response."""
    id: int
    user_id: int
    connection_id: int
    status: str
    draft_subject: Optional[str] = None
    draft_body: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    reply_received_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GenerateDraftRequest(BaseModel):
    """Schema for AI draft generation request."""
    original_subject: str
    original_body: str
    recipient_name: Optional[str] = None
    tone: str = Field(default="professional", pattern="^(professional|friendly|urgent)$")


class GenerateDraftResponse(BaseModel):
    """Schema for AI draft generation response."""
    subject: str
    body: str
