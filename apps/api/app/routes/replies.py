"""Reply endpoints for managing and viewing email replies."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.reply import Reply
from app.models.followup_job import FollowUpJob
from app.schemas.reply import ReplyResponse, SimulateReplyRequest

router = APIRouter()


@router.get("/replies", response_model=List[ReplyResponse])
async def list_replies(
    limit: int = Query(50, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    search: Optional[str] = Query(None, description="Search in email/subject"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all replies received for the current user.

    Args:
        limit: Maximum number of results
        offset: Offset for pagination
        search: Optional search string to filter by email or subject
        start_date: Optional start date filter
        end_date: Optional end date filter
        db: Database session
        current_user: Authenticated user

    Returns:
        List of replies with follow-up job details
    """
    query = db.query(Reply).filter(Reply.user_id == current_user.id)

    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Reply.from_email.ilike(search_pattern)) |
            (Reply.subject.ilike(search_pattern)) |
            (Reply.body.ilike(search_pattern))
        )

    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Reply.received_at >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            # Add one day to include the entire end date
            from datetime import timedelta
            end_dt = end_dt + timedelta(days=1)
            query = query.filter(Reply.received_at < end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )

    # Order by most recent first
    query = query.order_by(Reply.received_at.desc())

    # Apply pagination
    replies = query.offset(offset).limit(limit).all()

    return replies


@router.get("/replies/{reply_id}", response_model=ReplyResponse)
async def get_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific reply by ID.

    Args:
        reply_id: Reply ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Reply details

    Raises:
        HTTPException: If reply not found or doesn't belong to user
    """
    reply = db.query(Reply).filter(
        Reply.id == reply_id,
        Reply.user_id == current_user.id
    ).first()

    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    return reply


@router.post("/test/simulate-reply", response_model=ReplyResponse)
async def simulate_reply(
    request: SimulateReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulate receiving a reply to a follow-up email (for testing).

    This endpoint:
    1. Creates a reply record in the database
    2. Updates the follow-up job status to "replied"
    3. Sets the reply_received_at timestamp
    4. If the follow-up is part of a sequence and stop_on_reply is true, stops the sequence

    Args:
        request: Simulated reply data
        db: Database session
        current_user: Authenticated user

    Returns:
        Created reply record

    Raises:
        HTTPException: If follow-up job not found or doesn't belong to user
    """
    # Verify follow-up job exists and belongs to user
    followup_job = db.query(FollowUpJob).filter(
        FollowUpJob.id == request.followup_job_id,
        FollowUpJob.user_id == current_user.id
    ).first()

    if not followup_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up job not found"
        )

    # Check if follow-up was actually sent
    if followup_job.status not in ["sent", "scheduled", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot simulate reply for follow-up with status '{followup_job.status}'"
        )

    # Create reply record
    reply = Reply(
        followup_job_id=followup_job.id,
        user_id=current_user.id,
        from_email=request.from_email or followup_job.original_recipient,
        from_name=request.from_name,
        subject=request.subject or f"Re: {followup_job.draft_subject or followup_job.original_subject}",
        body=request.body,
        html_body=request.html_body,
        message_id=f"simulated-{datetime.utcnow().timestamp()}@test.local",
        in_reply_to=followup_job.original_message_id,
        received_at=datetime.utcnow(),
    )

    db.add(reply)

    # Update follow-up job status
    followup_job.status = "replied"
    followup_job.reply_received_at = datetime.utcnow()

    # If this follow-up is part of a sequence, stop the sequence for this recipient
    if followup_job.stop_on_reply:
        # Import here to avoid circular dependency
        from app.models.sequence import SequenceStep

        # Find if this follow-up is part of a sequence
        # Check if there are other pending/scheduled follow-ups for the same recipient
        # that should be cancelled
        other_followups = db.query(FollowUpJob).filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.original_recipient == followup_job.original_recipient,
            FollowUpJob.id != followup_job.id,
            FollowUpJob.status.in_(["pending", "scheduled"])
        ).all()

        for other_followup in other_followups:
            other_followup.status = "cancelled"
            other_followup.error_message = f"Cancelled: Reply received to follow-up #{followup_job.id}"

    db.commit()
    db.refresh(reply)

    return reply
