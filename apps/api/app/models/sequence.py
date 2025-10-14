"""Sequence model for multi-step follow-up campaigns."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Sequence(Base):
    """Sequence model for multi-step email campaigns."""

    __tablename__ = "sequences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    stop_on_reply = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="sequences")
    steps = relationship("SequenceStep", back_populates="sequence", cascade="all, delete-orphan", order_by="SequenceStep.step_number")
    enrollments = relationship("SequenceEnrollment", back_populates="sequence", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Sequence(id={self.id}, name='{self.name}', steps={len(self.steps)})>"


class SequenceStep(Base):
    """Individual step in a sequence."""

    __tablename__ = "sequence_steps"

    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    step_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.

    subject = Column(String, nullable=False)
    body = Column(String, nullable=False)
    tone = Column(String, nullable=False, default="professional")  # professional, friendly, urgent
    delay_days = Column(Integer, nullable=False)  # Days after previous step (0 for first step)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sequence = relationship("Sequence", back_populates="steps")

    def __repr__(self):
        return f"<SequenceStep(id={self.id}, step={self.step_number}, delay={self.delay_days}d)>"


class SequenceEnrollment(Base):
    """Tracks a recipient's enrollment in a sequence."""

    __tablename__ = "sequence_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    connection_id = Column(Integer, ForeignKey("connections.id"), nullable=False)

    recipient_email = Column(String, nullable=False)
    recipient_name = Column(String, nullable=True)

    status = Column(String, nullable=False, default="active")  # active, completed, stopped, failed
    current_step = Column(Integer, nullable=False, default=0)  # 0 means not started yet

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    stopped_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sequence = relationship("Sequence", back_populates="enrollments")
    user = relationship("User")

    def __repr__(self):
        return f"<SequenceEnrollment(id={self.id}, recipient='{self.recipient_email}', step={self.current_step})>"
