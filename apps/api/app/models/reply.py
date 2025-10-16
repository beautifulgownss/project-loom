"""Reply model for storing received replies to follow-ups."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Reply(Base):
    """Reply model for tracking responses to follow-up emails."""

    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    followup_job_id = Column(Integer, ForeignKey("followup_jobs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Reply email details
    from_email = Column(String, nullable=False)
    from_name = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    html_body = Column(Text, nullable=True)

    # Email metadata
    message_id = Column(String, nullable=True)  # Email message ID
    in_reply_to = Column(String, nullable=True)  # Original message ID being replied to
    received_at = Column(DateTime(timezone=True), nullable=False)

    # Processing metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    followup_job = relationship("FollowUpJob", backref="replies")
    user = relationship("User", back_populates="replies")

    def __repr__(self):
        return f"<Reply(id={self.id}, from_email='{self.from_email}', followup_job_id={self.followup_job_id})>"
