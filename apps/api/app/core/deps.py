"""Dependencies for FastAPI routes."""
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.

    TODO: Implement actual authentication with Clerk/Supabase JWT validation.
    For now, returns a mock user for development.
    """
    # Mock user for development - replace with actual auth
    user = db.query(User).first()

    if not user:
        # Create a development user if none exists
        user = User(
            email="dev@example.com",
            full_name="Dev User",
            auth_provider="dev",
            auth_id="dev_001"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
