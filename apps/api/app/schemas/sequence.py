"""Pydantic schemas for sequences."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# SequenceStep Schemas
class SequenceStepBase(BaseModel):
    """Base schema for sequence step."""
    step_number: int = Field(..., ge=1, description="Step number in sequence (1, 2, 3, etc.)")
    subject: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    tone: str = Field(..., pattern="^(professional|friendly|urgent)$")
    delay_days: int = Field(..., ge=0, description="Days after previous step (0 for first step)")


class SequenceStepCreate(SequenceStepBase):
    """Schema for creating a sequence step."""
    pass


class SequenceStepUpdate(BaseModel):
    """Schema for updating a sequence step."""
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    body: Optional[str] = Field(None, min_length=1)
    tone: Optional[str] = Field(None, pattern="^(professional|friendly|urgent)$")
    delay_days: Optional[int] = Field(None, ge=0)


class SequenceStepResponse(SequenceStepBase):
    """Schema for sequence step response."""
    id: int
    sequence_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Sequence Schemas
class SequenceBase(BaseModel):
    """Base schema for sequence."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    stop_on_reply: bool = Field(True, description="Stop sequence if recipient replies")
    is_active: bool = Field(True, description="Whether sequence is active")


class SequenceCreate(SequenceBase):
    """Schema for creating a sequence."""
    steps: List[SequenceStepCreate] = Field(..., min_items=2, max_items=5, description="2-5 follow-up steps")


class SequenceUpdate(BaseModel):
    """Schema for updating a sequence."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    stop_on_reply: Optional[bool] = None
    is_active: Optional[bool] = None


class SequenceResponse(SequenceBase):
    """Schema for sequence response."""
    id: int
    user_id: int
    steps: List[SequenceStepResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SequenceListResponse(BaseModel):
    """Schema for sequence list item (without full steps)."""
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    stop_on_reply: bool
    is_active: bool
    step_count: int
    enrollment_count: int
    active_enrollment_count: int
    completed_enrollment_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# SequenceEnrollment Schemas
class SequenceEnrollmentBase(BaseModel):
    """Base schema for sequence enrollment."""
    recipient_email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    recipient_name: Optional[str] = None


class SequenceEnrollmentCreate(SequenceEnrollmentBase):
    """Schema for creating a sequence enrollment."""
    connection_id: int = Field(..., description="Email connection to use for sending")


class SequenceEnrollmentResponse(SequenceEnrollmentBase):
    """Schema for sequence enrollment response."""
    id: int
    sequence_id: int
    user_id: int
    connection_id: int
    status: str  # active, completed, stopped, failed
    current_step: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StartSequenceRequest(BaseModel):
    """Schema for starting a sequence for a recipient."""
    recipient_email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    recipient_name: Optional[str] = None
    connection_id: int = Field(..., description="Email connection to use for sending")
