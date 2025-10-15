"""Connection model for email service integrations."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Connection(Base):
    """Email service connection model."""

    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # 'resend' or 'gmail'
    provider_email = Column(String, nullable=False)  # Email address for this connection
    status = Column(String, nullable=False, default="active")  # 'active', 'disabled', 'error'
    is_active = Column(Boolean, nullable=False, default=True)  # Quick boolean check for active status

    # Store encrypted credentials/tokens
    # For Resend: {"api_key": "re_..."}
    # For Gmail: {"access_token": "...", "refresh_token": "...", "client_id": "...", "client_secret": "...", "token_expiry": "..."}
    credentials = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="connections")

    @property
    def email(self) -> str:
        """Convenience property for provider_email"""
        return self.provider_email

    def __repr__(self):
        return f"<Connection(id={self.id}, provider='{self.provider}', email='{self.provider_email}')>"
