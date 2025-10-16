"""Brand schemas for request/response validation."""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Dict, List


class ToneAttributes(BaseModel):
    """Tone attributes for brand voice."""
    formality: str = Field(..., description="professional, casual, or balanced")
    enthusiasm: str = Field(..., description="reserved, moderate, or energetic")
    complexity: str = Field(..., description="simple, clear, or technical")
    emotion: str = Field(..., description="serious, balanced, or optimistic")
    humor: str = Field(..., description="none, subtle, or playful")
    voice_type: str = Field(..., description="authoritative, friendly, or inspirational")


class ExamplePhrases(BaseModel):
    """Example phrases for brand voice."""
    do_say: List[str] = Field(default_factory=list, description="Approved phrases")
    dont_say: List[str] = Field(default_factory=list, description="Banned phrases")


class BrandBase(BaseModel):
    """Base brand schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    industry: Optional[str] = Field(None, max_length=50)
    personality: Optional[str] = None
    tone_attributes: Dict = Field(default_factory=dict)
    example_phrases: Dict = Field(default_factory=dict)


class BrandCreate(BrandBase):
    """Schema for creating a brand."""
    is_primary: bool = Field(default=False, description="Set as default brand")


class BrandUpdate(BaseModel):
    """Schema for updating a brand."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    industry: Optional[str] = Field(None, max_length=50)
    personality: Optional[str] = None
    tone_attributes: Optional[Dict] = None
    example_phrases: Optional[Dict] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None


class BrandResponse(BrandBase):
    """Schema for brand response."""
    id: int
    user_id: int
    is_active: bool
    is_primary: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BrandListItem(BaseModel):
    """Lightweight schema for brand list."""
    id: int
    name: str
    industry: Optional[str] = None
    personality: Optional[str] = None
    is_active: bool
    is_primary: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
