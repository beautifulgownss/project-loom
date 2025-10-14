"""Follow-up job model."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class FollowUpJob(Base):
    """Follow-up job model for automated email sequences."""

    __tablename__ = "followup_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    connection_id = Column(Integer, ForeignKey("connections.id"), nullable=False)

    # Original email details
    original_recipient = Column(String, nullable=False)
    original_subject = Column(String, nullable=False)
    original_body = Column(Text, nullable=True)
    original_message_id = Column(String, nullable=True)  # For threading

    # Follow-up configuration
    delay_hours = Column(Integer, nullable=False, default=24)  # Hours to wait before follow-up
    tone = Column(String, nullable=False, default="professional")  # AI tone: professional, friendly, urgent
    max_followups = Column(Integer, nullable=False, default=1)  # Max number of follow-ups
    stop_on_reply = Column(Boolean, nullable=False, default=True)

    # AI-generated draft
    draft_subject = Column(String, nullable=True)
    draft_body = Column(Text, nullable=True)

    # Job status
    status = Column(String, nullable=False, default="pending")  # pending, scheduled, sent, replied, cancelled, failed
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    reply_received_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="followup_jobs")

    def __repr__(self):
        return f"<FollowUpJob(id={self.id}, status='{self.status}', recipient='{self.original_recipient}')>"
