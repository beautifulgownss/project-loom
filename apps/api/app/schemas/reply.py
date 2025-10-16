"""Reply schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class ReplyBase(BaseModel):
    """Base reply schema."""
    from_email: EmailStr
    from_name: Optional[str] = None
    subject: str
    body: str
    html_body: Optional[str] = None


class SimulateReplyRequest(BaseModel):
    """Schema for simulating a reply (testing only)."""
    followup_job_id: int
    from_email: Optional[EmailStr] = None  # If not provided, uses original_recipient
    from_name: Optional[str] = None
    subject: Optional[str] = None  # If not provided, uses "Re: {original_subject}"
    body: str
    html_body: Optional[str] = None


class ReplyResponse(ReplyBase):
    """Schema for reply response."""
    id: int
    followup_job_id: int
    user_id: int
    message_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    received_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
