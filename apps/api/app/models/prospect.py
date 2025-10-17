"""Prospect model with pain point research fields."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Prospect(Base):
    """Represents a single outreach prospect and their research insights."""

    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Core identity fields
    name = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    role = Column(String(120), nullable=True)
    industry = Column(String(120), nullable=True)

    # Optional enrichment metadata
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    location = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)

    # Pain point analysis output
    pain_points = Column(JSON, nullable=False, default=list)
    industry_insights = Column(JSON, nullable=False, default=dict)
    research_source = Column(String(120), nullable=True)
    last_researched_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="prospects")

    def __repr__(self) -> str:
        return f"<Prospect(id={self.id}, company='{self.company}', role='{self.role}')>"
