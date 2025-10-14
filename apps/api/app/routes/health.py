"""Health check endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.

    Returns system status and database connectivity.
    """
    # Check database connection
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "database": db_status,
    }
