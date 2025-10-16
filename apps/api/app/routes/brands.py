"""Brand endpoints for Voice Studio."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.brand import Brand
from app.schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandUpdate,
    BrandListItem,
)

router = APIRouter()


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new brand.

    Args:
        brand_data: Brand creation data
        db: Database session
        current_user: Authenticated user

    Returns:
        Created brand

    Raises:
        HTTPException: If validation fails
    """
    # If this is marked as primary, unset other primary brands
    if brand_data.is_primary:
        db.query(Brand).filter(
            Brand.user_id == current_user.id,
            Brand.is_primary == True
        ).update({"is_primary": False})

    # Create brand
    brand = Brand(
        user_id=current_user.id,
        name=brand_data.name,
        description=brand_data.description,
        industry=brand_data.industry,
        personality=brand_data.personality,
        tone_attributes=brand_data.tone_attributes or {},
        example_phrases=brand_data.example_phrases or {},
        is_primary=brand_data.is_primary,
        is_active=True,
    )

    db.add(brand)
    db.commit()
    db.refresh(brand)

    return brand


@router.get("/brands", response_model=List[BrandListItem])
async def list_brands(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all brands for the current user.

    Args:
        is_active: Optional filter by active status
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session
        current_user: Authenticated user

    Returns:
        List of brands
    """
    query = db.query(Brand).filter(Brand.user_id == current_user.id)

    # Apply active filter if provided
    if is_active is not None:
        query = query.filter(Brand.is_active == is_active)

    # Order by primary first, then by most recent
    query = query.order_by(Brand.is_primary.desc(), Brand.created_at.desc())

    # Apply pagination
    brands = query.offset(offset).limit(limit).all()

    return brands


@router.get("/brands/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific brand by ID.

    Args:
        brand_id: Brand ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Brand details

    Raises:
        HTTPException: If brand not found or doesn't belong to user
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.user_id == current_user.id
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    return brand


@router.patch("/brands/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a brand.

    Args:
        brand_id: Brand ID
        brand_data: Brand update data
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated brand

    Raises:
        HTTPException: If brand not found or doesn't belong to user
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.user_id == current_user.id
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # If setting this as primary, unset other primary brands
    if brand_data.is_primary and not brand.is_primary:
        db.query(Brand).filter(
            Brand.user_id == current_user.id,
            Brand.is_primary == True,
            Brand.id != brand_id
        ).update({"is_primary": False})

    # Update fields
    update_data = brand_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(brand, field, value)

    db.commit()
    db.refresh(brand)

    return brand


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a brand.

    Args:
        brand_id: Brand ID
        db: Database session
        current_user: Authenticated user

    Raises:
        HTTPException: If brand not found or doesn't belong to user
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.user_id == current_user.id
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    db.delete(brand)
    db.commit()

    return None


@router.get("/brands/primary/current", response_model=BrandResponse)
async def get_primary_brand(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the user's primary (default) brand.

    Args:
        db: Database session
        current_user: Authenticated user

    Returns:
        Primary brand

    Raises:
        HTTPException: If no primary brand exists
    """
    brand = db.query(Brand).filter(
        Brand.user_id == current_user.id,
        Brand.is_primary == True,
        Brand.is_active == True
    ).first()

    if not brand:
        # Fall back to first active brand
        brand = db.query(Brand).filter(
            Brand.user_id == current_user.id,
            Brand.is_active == True
        ).order_by(Brand.created_at.asc()).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active brand found. Please create a brand first."
        )

    return brand
