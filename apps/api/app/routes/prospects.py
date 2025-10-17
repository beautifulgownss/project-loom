"""Prospect import and research endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.prospect import Prospect
from app.models.user import User
from app.schemas.prospect import (
    ProspectImportRequest,
    ProspectRefreshRequest,
    ProspectResponse,
)
from app.services.prospect_research import ProspectResearchContext, ProspectResearchService

router = APIRouter()


def _build_context_from_payload(data, company: str) -> ProspectResearchContext:
    """Create a research context from incoming payload data."""
    return ProspectResearchContext(
        name=data.name,
        company=company,
        role=data.role,
        industry=data.industry,
        website=data.website,
        linkedin_url=data.linkedin_url,
        notes=data.notes,
    )


def _build_context_from_model(prospect: Prospect) -> ProspectResearchContext:
    """Create a research context from a Prospect ORM instance."""
    return ProspectResearchContext(
        name=prospect.name,
        company=prospect.company,
        role=prospect.role,
        industry=prospect.industry,
        website=prospect.website,
        linkedin_url=prospect.linkedin_url,
        notes=prospect.notes,
    )


@router.post("/prospects/import", response_model=List[ProspectResponse], status_code=status.HTTP_201_CREATED)
async def import_prospects(
    payload: ProspectImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bulk import prospects with optional pain point analysis.

    Existing prospects (matched by email) are updated in-place to keep campaigns intact.
    """
    research_service = ProspectResearchService()
    imported: List[Prospect] = []

    for item in payload.prospects:
        # Match by email when possible, otherwise by name/company combination
        prospect_query = db.query(Prospect).filter(Prospect.user_id == current_user.id)
        if item.email:
            prospect_query = prospect_query.filter(Prospect.email == item.email)
        else:
            prospect_query = prospect_query.filter(
                Prospect.name == item.name,
                Prospect.company == item.company,
            )

        prospect = prospect_query.first()

        created_new = False
        if not prospect:
            prospect = Prospect(user_id=current_user.id)
            created_new = True

        prospect.name = item.name
        prospect.company = item.company
        prospect.role = item.role
        prospect.industry = item.industry
        prospect.email = item.email
        prospect.website = item.website
        prospect.linkedin_url = item.linkedin_url
        prospect.location = item.location
        prospect.notes = item.notes

        if payload.analyze_pain_points:
            analysis = research_service.run_pain_point_analysis(_build_context_from_payload(item, item.company))
            prospect.pain_points = analysis.pain_points
            prospect.industry_insights = analysis.industry_insights
            prospect.research_source = analysis.research_source
            prospect.last_researched_at = datetime.utcnow()
        elif created_new:
            # Ensure new prospects have JSON defaults even if analysis skipped
            prospect.pain_points = prospect.pain_points or []
            prospect.industry_insights = prospect.industry_insights or {}

        if created_new:
            db.add(prospect)

        imported.append(prospect)

    db.commit()
    for prospect in imported:
        db.refresh(prospect)

    return imported


@router.get("/prospects", response_model=List[ProspectResponse])
async def list_prospects(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List prospects for the current user."""
    prospects = (
        db.query(Prospect)
        .filter(Prospect.user_id == current_user.id)
        .order_by(Prospect.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return prospects


@router.get("/prospects/{prospect_id}", response_model=ProspectResponse)
async def get_prospect(
    prospect_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single prospect with stored pain point analysis."""
    prospect = (
        db.query(Prospect)
        .filter(Prospect.id == prospect_id, Prospect.user_id == current_user.id)
        .first()
    )

    if not prospect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prospect not found")

    return prospect


@router.post("/prospects/{prospect_id}/refresh", response_model=ProspectResponse)
async def refresh_pain_points(
    prospect_id: int,
    payload: ProspectRefreshRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run pain point analysis for a single prospect."""
    prospect = (
        db.query(Prospect)
        .filter(Prospect.id == prospect_id, Prospect.user_id == current_user.id)
        .first()
    )

    if not prospect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prospect not found")

    if payload.analyze_pain_points:
        research_service = ProspectResearchService()
        analysis = research_service.run_pain_point_analysis(_build_context_from_model(prospect))

        prospect.pain_points = analysis.pain_points
        prospect.industry_insights = analysis.industry_insights
        prospect.research_source = analysis.research_source
        prospect.last_researched_at = datetime.utcnow()

        db.add(prospect)
        db.commit()
        db.refresh(prospect)

    return prospect
