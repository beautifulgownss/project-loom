"""User settings model."""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserSettings(Base):
    """User settings model."""

    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Email signature
    email_signature = Column(Text, nullable=True)

    # Brand voice (JSON)
    brand_voice = Column(JSON, nullable=True, default={})

    # Notification preferences (JSON)
    notification_preferences = Column(JSON, nullable=True, default={})

    # API keys (encrypted/hashed in production)
    api_keys = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="settings")

    def __repr__(self):
        return f"<UserSettings(id={self.id}, user_id={self.user_id})>"
