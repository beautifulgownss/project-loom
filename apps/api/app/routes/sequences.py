"""API routes for sequences."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, Integer

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.sequence import Sequence, SequenceStep, SequenceEnrollment
from app.models.user import User
from app.schemas.sequence import (
    SequenceCreate,
    SequenceUpdate,
    SequenceResponse,
    SequenceListResponse,
    SequenceEnrollmentCreate,
    SequenceEnrollmentResponse,
    StartSequenceRequest,
)

router = APIRouter(prefix="/sequences", tags=["sequences"])


@router.post("", response_model=SequenceResponse, status_code=status.HTTP_201_CREATED)
async def create_sequence(
    sequence_data: SequenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new multi-step follow-up sequence."""

    # Validate that steps are numbered sequentially
    step_numbers = [step.step_number for step in sequence_data.steps]
    if sorted(step_numbers) != list(range(1, len(step_numbers) + 1)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step numbers must be sequential starting from 1"
        )

    # Validate that first step has delay_days = 0
    first_step = next((s for s in sequence_data.steps if s.step_number == 1), None)
    if first_step and first_step.delay_days != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First step (step 1) must have delay_days = 0"
        )

    # Create sequence
    db_sequence = Sequence(
        user_id=current_user.id,
        name=sequence_data.name,
        description=sequence_data.description,
        stop_on_reply=sequence_data.stop_on_reply,
        is_active=sequence_data.is_active,
    )
    db.add(db_sequence)
    db.flush()  # Get the sequence ID

    # Create steps
    for step_data in sequence_data.steps:
        db_step = SequenceStep(
            sequence_id=db_sequence.id,
            step_number=step_data.step_number,
            subject=step_data.subject,
            body=step_data.body,
            tone=step_data.tone,
            delay_days=step_data.delay_days,
        )
        db.add(db_step)

    db.commit()
    db.refresh(db_sequence)

    return db_sequence


@router.get("", response_model=List[SequenceListResponse])
async def list_sequences(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all sequences for the current user."""

    query = db.query(
        Sequence,
        func.count(SequenceStep.id).label("step_count"),
        func.count(SequenceEnrollment.id).label("enrollment_count"),
        func.sum(
            func.cast(SequenceEnrollment.status == "active", Integer)
        ).label("active_enrollment_count"),
        func.sum(
            func.cast(SequenceEnrollment.status == "completed", Integer)
        ).label("completed_enrollment_count"),
    ).filter(
        Sequence.user_id == current_user.id
    ).outerjoin(
        SequenceStep, Sequence.id == SequenceStep.sequence_id
    ).outerjoin(
        SequenceEnrollment, Sequence.id == SequenceEnrollment.sequence_id
    ).group_by(
        Sequence.id
    )

    if is_active is not None:
        query = query.filter(Sequence.is_active == is_active)

    query = query.order_by(Sequence.created_at.desc()).offset(skip).limit(limit)

    results = query.all()

    # Build response objects
    response = []
    for seq, step_count, enrollment_count, active_count, completed_count in results:
        response.append(
            SequenceListResponse(
                id=seq.id,
                user_id=seq.user_id,
                name=seq.name,
                description=seq.description,
                stop_on_reply=seq.stop_on_reply,
                is_active=seq.is_active,
                step_count=step_count or 0,
                enrollment_count=enrollment_count or 0,
                active_enrollment_count=active_count or 0,
                completed_enrollment_count=completed_count or 0,
                created_at=seq.created_at,
                updated_at=seq.updated_at,
            )
        )

    return response


@router.get("/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(
    sequence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific sequence with all steps."""

    sequence = (
        db.query(Sequence)
        .options(joinedload(Sequence.steps))
        .filter(Sequence.id == sequence_id, Sequence.user_id == current_user.id)
        .first()
    )

    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sequence not found"
        )

    return sequence


@router.patch("/{sequence_id}", response_model=SequenceResponse)
async def update_sequence(
    sequence_id: int,
    sequence_data: SequenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a sequence."""

    sequence = (
        db.query(Sequence)
        .filter(Sequence.id == sequence_id, Sequence.user_id == current_user.id)
        .first()
    )

    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sequence not found"
        )

    # Update fields
    update_data = sequence_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sequence, field, value)

    db.commit()
    db.refresh(sequence)

    return sequence


@router.delete("/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sequence(
    sequence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a sequence."""

    sequence = (
        db.query(Sequence)
        .filter(Sequence.id == sequence_id, Sequence.user_id == current_user.id)
        .first()
    )

    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sequence not found"
        )

    db.delete(sequence)
    db.commit()

    return None


@router.post("/{sequence_id}/start", response_model=SequenceEnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def start_sequence(
    sequence_id: int,
    enrollment_data: StartSequenceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a sequence for a recipient."""

    # Check if sequence exists and is active
    sequence = (
        db.query(Sequence)
        .filter(Sequence.id == sequence_id, Sequence.user_id == current_user.id)
        .first()
    )

    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sequence not found"
        )

    if not sequence.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start an inactive sequence"
        )

    # Check if recipient is already enrolled
    existing_enrollment = (
        db.query(SequenceEnrollment)
        .filter(
            SequenceEnrollment.sequence_id == sequence_id,
            SequenceEnrollment.recipient_email == enrollment_data.recipient_email,
            SequenceEnrollment.status == "active"
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient is already enrolled in this sequence"
        )

    # Create enrollment
    db_enrollment = SequenceEnrollment(
        sequence_id=sequence_id,
        user_id=current_user.id,
        connection_id=enrollment_data.connection_id,
        recipient_email=enrollment_data.recipient_email,
        recipient_name=enrollment_data.recipient_name,
        status="active",
        current_step=0,  # Not started yet
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)

    return db_enrollment


@router.get("/{sequence_id}/enrollments", response_model=List[SequenceEnrollmentResponse])
async def list_sequence_enrollments(
    sequence_id: int,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all enrollments for a sequence."""

    # Verify sequence ownership
    sequence = (
        db.query(Sequence)
        .filter(Sequence.id == sequence_id, Sequence.user_id == current_user.id)
        .first()
    )

    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sequence not found"
        )

    query = db.query(SequenceEnrollment).filter(
        SequenceEnrollment.sequence_id == sequence_id
    )

    if status_filter:
        query = query.filter(SequenceEnrollment.status == status_filter)

    enrollments = query.order_by(SequenceEnrollment.created_at.desc()).offset(skip).limit(limit).all()

    return enrollments


@router.post("/{sequence_id}/enrollments/{enrollment_id}/stop", response_model=SequenceEnrollmentResponse)
async def stop_enrollment(
    sequence_id: int,
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stop an active enrollment."""

    enrollment = (
        db.query(SequenceEnrollment)
        .filter(
            SequenceEnrollment.id == enrollment_id,
            SequenceEnrollment.sequence_id == sequence_id,
            SequenceEnrollment.user_id == current_user.id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )

    if enrollment.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only stop active enrollments"
        )

    enrollment.status = "stopped"
    from datetime import datetime
    enrollment.stopped_at = datetime.utcnow()

    db.commit()
    db.refresh(enrollment)

    return enrollment
