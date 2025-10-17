"""Pydantic schemas for prospect research and pain point analysis."""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class PainPointAnalysis(BaseModel):
    """Structured output from the pain point service."""

    pain_points: List[str] = Field(default_factory=list)
    industry_insights: dict[str, Any] = Field(default_factory=dict)
    research_source: Optional[str] = None


class ProspectBase(BaseModel):
    """Shared prospect fields."""

    name: str = Field(..., max_length=150)
    company: str = Field(..., max_length=150)
    role: Optional[str] = Field(default=None, max_length=120)
    industry: Optional[str] = Field(default=None, max_length=120)
    email: Optional[str] = Field(default=None, max_length=255)
    website: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)
    location: Optional[str] = Field(default=None, max_length=150)
    notes: Optional[str] = None


class ProspectCreate(ProspectBase):
    """Request payload for creating/importing a prospect."""

    pass


class ProspectUpdate(ProspectBase):
    """Update payload for prospect metadata and analysis overrides."""

    pain_points: Optional[List[str]] = None
    industry_insights: Optional[dict[str, Any]] = None
    research_source: Optional[str] = None


class ProspectResponse(ProspectBase):
    """API response model for prospects."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    pain_points: List[str] = Field(default_factory=list)
    industry_insights: dict[str, Any] = Field(default_factory=dict)
    research_source: Optional[str] = None
    last_researched_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProspectImportRequest(BaseModel):
    """Bulk import request with optional research toggle."""

    prospects: List[ProspectCreate]
    analyze_pain_points: bool = Field(default=False, description="Run pain point analysis during import")


class ProspectRefreshRequest(BaseModel):
    """Trigger a new round of pain point analysis for a single prospect."""

    analyze_pain_points: bool = Field(default=True)
