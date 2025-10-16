"""Settings schemas for request/response validation."""
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


class BrandVoice(BaseModel):
    """Brand voice configuration."""
    personality: Optional[str] = None  # professional, friendly, casual, authoritative
    target_audience: Optional[str] = None
    key_messaging_points: Optional[list[str]] = None
    tone_guidelines: Optional[Dict[str, Any]] = None  # {'dos': [...], 'donts': [...]}
    example_phrases: Optional[list[str]] = None


class NotificationPreferences(BaseModel):
    """Notification preferences."""
    email_on_draft_ready: bool = True
    email_on_followup_sent: bool = True
    email_on_reply_received: bool = True
    email_on_errors: bool = True
    weekly_summary: bool = True


class APIKeys(BaseModel):
    """API keys configuration."""
    openai_api_key: Optional[str] = None
    resend_api_key: Optional[str] = None


class SettingsBase(BaseModel):
    """Base settings schema."""
    email_signature: Optional[str] = None
    brand_voice: Optional[BrandVoice] = None
    notification_preferences: Optional[NotificationPreferences] = None
    api_keys: Optional[APIKeys] = None


class SettingsUpdate(BaseModel):
    """Schema for updating settings."""
    email_signature: Optional[str] = None
    brand_voice: Optional[BrandVoice] = None
    notification_preferences: Optional[NotificationPreferences] = None
    api_keys: Optional[APIKeys] = None


class SettingsResponse(SettingsBase):
    """Schema for settings response."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
