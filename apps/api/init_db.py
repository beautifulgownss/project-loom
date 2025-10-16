#!/usr/bin/env python3
"""
Database initialization script.

This script:
1. Creates all database tables
2. Creates a test user
3. Creates a test connection
"""

import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.connection import Connection
from app.models.followup_job import FollowUpJob
from app.models.sequence import Sequence, SequenceStep, SequenceEnrollment
from app.models.user_settings import UserSettings
from app.models.reply import Reply
from app.models.brand import Brand


def init_database():
    """Initialize the database with tables and test data."""

    print("🗄️  Initializing database...")

    # Drop all existing tables
    print("🧹 Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)

    # Create all tables
    print("📋 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

    # Create a session
    db = SessionLocal()

    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "dev@example.com").first()

        if existing_user:
            print("ℹ️  Test user already exists, skipping user creation")
            user = existing_user
        else:
            # Create test user
            print("👤 Creating test user...")
            user = User(
                email="dev@example.com",
                full_name="Dev User",
                auth_provider="dev",
                auth_id="dev_001"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Test user created: {user.email} (ID: {user.id})")

        # Check if test connection already exists
        existing_connection = db.query(Connection).filter(
            Connection.user_id == user.id,
            Connection.provider == "resend"
        ).first()

        if existing_connection:
            print("ℹ️  Test connection already exists, skipping connection creation")
        else:
            # Create test connection
            print("🔗 Creating test connection...")
            connection = Connection(
                user_id=user.id,
                provider="resend",
                provider_email="dev@example.com",
                status="active",
                credentials={"api_key": "test_key"}
            )
            db.add(connection)
            db.commit()
            db.refresh(connection)
            print(f"✅ Test connection created: {connection.provider} (ID: {connection.id})")

        print("\n✨ Database initialization complete!")
        print("\n📊 Summary:")
        print(f"   Users: {db.query(User).count()}")
        print(f"   User Settings: {db.query(UserSettings).count()}")
        print(f"   Connections: {db.query(Connection).count()}")
        print(f"   Follow-up Jobs: {db.query(FollowUpJob).count()}")
        print(f"   Replies: {db.query(Reply).count()}")
        print(f"   Brands: {db.query(Brand).count()}")
        print(f"   Sequences: {db.query(Sequence).count()}")
        print(f"   Sequence Enrollments: {db.query(SequenceEnrollment).count()}")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
