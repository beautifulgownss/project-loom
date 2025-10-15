"""Follow-up job endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.followup_job import FollowUpJob
from app.schemas.followup_job import (
    FollowUpJobCreate,
    FollowUpJobResponse,
    FollowUpJobUpdate,
)

router = APIRouter()


@router.post("/followups", response_model=FollowUpJobResponse, status_code=status.HTTP_201_CREATED)
async def create_followup_job(
    job_data: FollowUpJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new follow-up job.

    Args:
        job_data: Follow-up job creation data
        db: Database session
        current_user: Authenticated user

    Returns:
        Created follow-up job

    Raises:
        HTTPException: If connection_id doesn't exist or doesn't belong to user, or no active connections found
    """
    from app.models.connection import Connection

    # If connection_id not provided, use user's first active connection
    if job_data.connection_id is None:
        connection = db.query(Connection).filter(
            Connection.user_id == current_user.id,
            Connection.is_active == True,
            Connection.status == "active"
        ).first()

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active email connections found. Please add an email connection first."
            )

        connection_id = connection.id
    else:
        # Verify provided connection exists and belongs to user
        connection = db.query(Connection).filter(
            Connection.id == job_data.connection_id,
            Connection.user_id == current_user.id
        ).first()

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found or doesn't belong to user"
            )

        if connection.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection is {connection.status}, not active"
            )

        connection_id = job_data.connection_id

    # Calculate scheduled time
    scheduled_at = datetime.utcnow() + timedelta(hours=job_data.delay_hours)

    # Create follow-up job
    followup_job = FollowUpJob(
        user_id=current_user.id,
        connection_id=connection_id,
        original_recipient=job_data.original_recipient,
        original_subject=job_data.original_subject,
        original_body=job_data.original_body,
        original_message_id=job_data.original_message_id,
        delay_hours=job_data.delay_hours,
        tone=job_data.tone,
        max_followups=job_data.max_followups,
        stop_on_reply=job_data.stop_on_reply,
        status="pending",
        scheduled_at=scheduled_at,
    )

    db.add(followup_job)
    db.commit()
    db.refresh(followup_job)

    return followup_job


@router.get("/followups", response_model=List[FollowUpJobResponse])
async def list_followup_jobs(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all follow-up jobs for the current user.

    Args:
        status_filter: Optional status filter (pending, scheduled, sent, replied, cancelled, failed)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session
        current_user: Authenticated user

    Returns:
        List of follow-up jobs
    """
    query = db.query(FollowUpJob).filter(FollowUpJob.user_id == current_user.id)

    # Apply status filter if provided
    if status_filter:
        valid_statuses = ["pending", "scheduled", "sent", "replied", "cancelled", "failed"]
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        query = query.filter(FollowUpJob.status == status_filter)

    # Order by most recent first
    query = query.order_by(FollowUpJob.created_at.desc())

    # Apply pagination
    jobs = query.offset(offset).limit(limit).all()

    return jobs


@router.get("/followups/{job_id}", response_model=FollowUpJobResponse)
async def get_followup_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific follow-up job by ID.

    Args:
        job_id: Follow-up job ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Follow-up job details

    Raises:
        HTTPException: If job not found or doesn't belong to user
    """
    job = db.query(FollowUpJob).filter(
        FollowUpJob.id == job_id,
        FollowUpJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up job not found"
        )

    return job


@router.post("/followups/{job_id}/cancel", response_model=FollowUpJobResponse)
async def cancel_followup_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a scheduled follow-up job.

    Args:
        job_id: Follow-up job ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated follow-up job with cancelled status

    Raises:
        HTTPException: If job not found, doesn't belong to user, or already sent
    """
    job = db.query(FollowUpJob).filter(
        FollowUpJob.id == job_id,
        FollowUpJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up job not found"
        )

    # Can only cancel pending or scheduled jobs
    if job.status in ["sent", "replied"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status '{job.status}'"
        )

    if job.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is already cancelled"
        )

    # Update status to cancelled
    job.status = "cancelled"
    db.commit()
    db.refresh(job)

    return job


@router.post("/followups/{job_id}/send-now", response_model=FollowUpJobResponse)
async def send_followup_now(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Immediately send a scheduled follow-up (for testing).

    Args:
        job_id: Follow-up job ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated follow-up job

    Raises:
        HTTPException: If job not found, doesn't belong to user, or already sent
    """
    from app.services.followup_sender import FollowUpSender

    job = db.query(FollowUpJob).filter(
        FollowUpJob.id == job_id,
        FollowUpJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up job not found"
        )

    # Check if already sent
    if job.status == "sent":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Follow-up has already been sent"
        )

    # Can't send cancelled jobs
    if job.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send cancelled follow-up"
        )

    # Send the follow-up
    sender = FollowUpSender(db)
    success, error_msg = sender.send_followup(job_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send follow-up: {error_msg}"
        )

    # Refresh to get updated status
    db.refresh(job)

    return job


@router.post("/followups/{job_id}/retry", response_model=FollowUpJobResponse)
async def retry_followup(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retry a failed follow-up.

    Args:
        job_id: Follow-up job ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated follow-up job

    Raises:
        HTTPException: If job not found, doesn't belong to user, or not in failed status
    """
    from app.services.followup_sender import FollowUpSender

    job = db.query(FollowUpJob).filter(
        FollowUpJob.id == job_id,
        FollowUpJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up job not found"
        )

    # Can only retry failed jobs
    if job.status not in ["failed", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only retry failed or pending jobs, current status: {job.status}"
        )

    # Retry the follow-up
    sender = FollowUpSender(db)
    success, error_msg = sender.retry_failed_followup(job_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retry failed: {error_msg}"
        )

    # Refresh to get updated status
    db.refresh(job)

    return job


@router.post("/test/send-email")
async def send_test_email(
    connection_id: int,
    to_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a test email to verify connection works.

    Args:
        connection_id: Email connection ID to test
        to_email: Email address to send test to
        db: Database session
        current_user: Authenticated user

    Returns:
        Success message

    Raises:
        HTTPException: If connection not found or test fails
    """
    from app.services.followup_sender import FollowUpSender
    from app.models.connection import Connection

    # Verify connection exists and belongs to user
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found or doesn't belong to user"
        )

    # Send test email
    sender = FollowUpSender(db)
    success, error_msg = sender.send_test_email(connection_id, to_email)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test email failed: {error_msg}"
        )

    return {
        "success": True,
        "message": f"Test email sent successfully to {to_email}",
        "provider": connection.provider
    }
