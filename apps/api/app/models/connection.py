"""Connection model for email service integrations."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
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

    # Store encrypted credentials/tokens
    credentials = Column(JSON, nullable=True)  # OAuth tokens, API keys, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="connections")

    def __repr__(self):
        return f"<Connection(id={self.id}, provider='{self.provider}', email='{self.provider_email}')>"
