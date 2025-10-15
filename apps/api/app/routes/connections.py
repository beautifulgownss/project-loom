"""Connection management endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.connection import Connection
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionUpdate,
)
from app.services.email_service import EmailService

router = APIRouter()


@router.post("/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection_data: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new email connection.

    Args:
        connection_data: Connection creation data (provider, email, credentials)
        db: Database session
        current_user: Authenticated user

    Returns:
        Created connection

    Raises:
        HTTPException: If provider is invalid or credentials are missing
    """
    # Validate provider
    if connection_data.provider not in ["resend", "gmail"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider must be 'resend' or 'gmail'"
        )

    # Validate credentials are provided
    if not connection_data.credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credentials are required"
        )

    # For Resend, validate API key is present
    if connection_data.provider == "resend":
        if "api_key" not in connection_data.credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resend requires 'api_key' in credentials"
            )

    # For Gmail, validate OAuth tokens are present
    if connection_data.provider == "gmail":
        required_fields = ["access_token", "refresh_token", "client_id", "client_secret"]
        missing_fields = [f for f in required_fields if f not in connection_data.credentials]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gmail requires {', '.join(missing_fields)} in credentials"
            )

    # Create connection
    connection = Connection(
        user_id=current_user.id,
        provider=connection_data.provider,
        provider_email=connection_data.provider_email,
        credentials=connection_data.credentials,
        status="active",
        is_active=True,
    )

    db.add(connection)
    db.commit()
    db.refresh(connection)

    return connection


@router.get("/connections", response_model=List[ConnectionResponse])
async def list_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all email connections for the current user.

    Args:
        db: Database session
        current_user: Authenticated user

    Returns:
        List of connections
    """
    connections = db.query(Connection).filter(
        Connection.user_id == current_user.id
    ).order_by(Connection.created_at.desc()).all()

    return connections


@router.get("/connections/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific connection by ID.

    Args:
        connection_id: Connection ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Connection details

    Raises:
        HTTPException: If connection not found or doesn't belong to user
    """
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    return connection


@router.patch("/connections/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: int,
    update_data: ConnectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a connection.

    Args:
        connection_id: Connection ID
        update_data: Fields to update (status, is_active, credentials)
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated connection

    Raises:
        HTTPException: If connection not found or doesn't belong to user
    """
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Update fields
    if update_data.status is not None:
        connection.status = update_data.status

    if update_data.is_active is not None:
        connection.is_active = update_data.is_active

    if update_data.credentials is not None:
        connection.credentials = update_data.credentials

    db.commit()
    db.refresh(connection)

    return connection


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a connection.

    Args:
        connection_id: Connection ID
        db: Database session
        current_user: Authenticated user

    Raises:
        HTTPException: If connection not found or doesn't belong to user
    """
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    db.delete(connection)
    db.commit()

    return None


@router.post("/connections/{connection_id}/validate")
async def validate_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate that a connection is working properly.

    Args:
        connection_id: Connection ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Validation result

    Raises:
        HTTPException: If connection not found or validation fails
    """
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Validate connection
    try:
        is_valid = EmailService.validate_connection(connection)

        if is_valid:
            # Update status to active
            connection.status = "active"
            connection.is_active = True
            db.commit()

            return {
                "valid": True,
                "message": "Connection validated successfully",
                "provider": connection.provider
            }
        else:
            # Update status to error
            connection.status = "error"
            connection.is_active = False
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection validation failed"
            )

    except Exception as e:
        # Update status to error
        connection.status = "error"
        connection.is_active = False
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )
