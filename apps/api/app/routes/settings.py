"""Settings management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate, BrandVoice, NotificationPreferences, APIKeys

router = APIRouter()


def get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    """Get user settings or create if not exists."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    if not settings:
        settings = UserSettings(
            user_id=user_id,
            email_signature=None,
            brand_voice={},
            notification_preferences={
                "email_on_draft_ready": True,
                "email_on_followup_sent": True,
                "email_on_reply_received": True,
                "email_on_errors": True,
                "weekly_summary": True
            },
            api_keys={}
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user settings.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        User settings
    """
    settings = get_or_create_settings(db, current_user.id)
    return settings


@router.patch("/settings", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user settings.

    Args:
        settings_update: Settings update data
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated user settings
    """
    settings = get_or_create_settings(db, current_user.id)

    # Update fields if provided
    if settings_update.email_signature is not None:
        settings.email_signature = settings_update.email_signature

    if settings_update.brand_voice is not None:
        settings.brand_voice = settings_update.brand_voice.model_dump(exclude_none=True)

    if settings_update.notification_preferences is not None:
        settings.notification_preferences = settings_update.notification_preferences.model_dump()

    if settings_update.api_keys is not None:
        # In production, encrypt these keys!
        settings.api_keys = settings_update.api_keys.model_dump(exclude_none=True)

    db.commit()
    db.refresh(settings)

    return settings
