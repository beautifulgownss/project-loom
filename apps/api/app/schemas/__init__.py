"""Pydantic schemas for request/response validation."""
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.connection import ConnectionCreate, ConnectionUpdate, ConnectionResponse
from app.schemas.followup_job import (
    FollowUpJobCreate,
    FollowUpJobUpdate,
    FollowUpJobResponse,
    GenerateDraftRequest,
    GenerateDraftResponse,
)

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "ConnectionCreate",
    "ConnectionUpdate",
    "ConnectionResponse",
    "FollowUpJobCreate",
    "FollowUpJobUpdate",
    "FollowUpJobResponse",
    "GenerateDraftRequest",
    "GenerateDraftResponse",
]
