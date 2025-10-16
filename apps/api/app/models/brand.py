"""Brand model for Voice Studio."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Brand(Base):
    """Brand voice profile model."""

    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Basic Info
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(50), nullable=True)

    # Brand Personality
    personality = Column(Text, nullable=True)  # Overall personality description

    # Tone Attributes (JSON for flexibility)
    tone_attributes = Column(JSON, nullable=False, default=dict)
    """
    Example structure:
    {
        "formality": "professional",        # professional, casual, balanced
        "enthusiasm": "moderate",           # reserved, moderate, energetic
        "complexity": "clear",              # simple, clear, technical
        "emotion": "optimistic",            # serious, balanced, optimistic
        "humor": "subtle",                  # none, subtle, playful
        "voice_type": "authoritative"       # authoritative, friendly, inspirational
    }
    """

    # Example Phrases (JSON array)
    example_phrases = Column(JSON, nullable=False, default=dict)
    """
    Example structure:
    {
        "do_say": ["helping you succeed", "simple solution"],
        "dont_say": ["synergy", "leverage", "game-changing"]
    }
    """

    # Settings
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)  # Default brand for user

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="brands")

    def __repr__(self):
        return f"<Brand(id={self.id}, name='{self.name}', user_id={self.user_id})>"
