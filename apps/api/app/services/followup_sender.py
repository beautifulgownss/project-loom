"""
Follow-Up Email Sender Service

Handles sending follow-up emails with retry logic, error handling,
and status tracking.
"""

import logging
from typing import Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import time

from app.models.followup_job import FollowUpJob
from app.models.connection import Connection
from app.services.email_service import EmailService, EmailSendResult
from app.services.email_template import EmailTemplate

logger = logging.getLogger(__name__)


class FollowUpSender:
    """Service for sending follow-up emails"""

    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAYS = [60, 300, 900]  # 1 min, 5 min, 15 min

    def __init__(self, db: Session):
        self.db = db

    def send_followup(
        self,
        followup_job_id: int,
        retry_attempt: int = 0
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a follow-up email

        Args:
            followup_job_id: ID of the follow-up job to send
            retry_attempt: Current retry attempt number (0 = first attempt)

        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        try:
            # Fetch follow-up job
            followup_job = self.db.query(FollowUpJob).filter(
                FollowUpJob.id == followup_job_id
            ).first()

            if not followup_job:
                error_msg = f"Follow-up job {followup_job_id} not found"
                logger.error(error_msg)
                return False, error_msg

            # Check if already sent
            if followup_job.status == "sent":
                logger.warning(f"Follow-up job {followup_job_id} already sent")
                return True, None

            # Get user's active email connection
            connection = self.db.query(Connection).filter(
                Connection.id == followup_job.connection_id,
                Connection.is_active == True
            ).first()

            if not connection:
                error_msg = f"No active connection found for follow-up job {followup_job_id}"
                logger.error(error_msg)
                self._mark_failed(followup_job, error_msg)
                return False, error_msg

            # Generate AI draft if not already generated
            if not followup_job.draft_body or not followup_job.draft_subject:
                logger.info(f"Generating AI draft for follow-up {followup_job_id}")
                try:
                    from app.routes.ai import generate_followup_draft

                    subject, body = generate_followup_draft(
                        original_subject=followup_job.original_subject,
                        original_body=followup_job.original_body or "",
                        recipient_name=None,  # TODO: Extract from original_recipient
                        tone=followup_job.tone,
                    )

                    # Store the generated draft
                    followup_job.draft_subject = subject
                    followup_job.draft_body = body
                    followup_job.updated_at = datetime.utcnow()
                    self.db.commit()

                    logger.info(f"AI draft generated successfully for follow-up {followup_job_id}")
                except Exception as e:
                    error_msg = f"Failed to generate AI draft: {str(e)}"
                    logger.error(f"Follow-up {followup_job_id}: {error_msg}")
                    self._mark_failed(followup_job, error_msg)
                    return False, error_msg

            # Prepare email content
            subject = followup_job.draft_subject or "Follow-up"
            body = followup_job.draft_body or ""

            # Format HTML email
            html_body = EmailTemplate.format_email(
                body=body,
                signature=None,  # TODO: Get from user settings
                recipient_email=followup_job.original_recipient,
                unsubscribe_url=None  # TODO: Generate unsubscribe link
            )

            # Send email
            logger.info(
                f"Sending follow-up {followup_job_id} to {followup_job.original_recipient} "
                f"(attempt {retry_attempt + 1}/{self.MAX_RETRY_ATTEMPTS + 1})"
            )

            result = EmailService.send_email(
                connection=connection,
                to_email=followup_job.original_recipient,
                subject=subject,
                html_body=html_body,
                from_name=None,  # TODO: Get from user settings
                reply_to=None
            )

            if result.success:
                # Update job status to sent
                followup_job.status = "sent"
                followup_job.sent_at = datetime.utcnow()
                followup_job.updated_at = datetime.utcnow()

                # Store message ID if available
                if result.message_id:
                    # We could add a message_id field to the model
                    logger.info(f"Email sent with message_id: {result.message_id}")

                self.db.commit()

                logger.info(f"Follow-up {followup_job_id} sent successfully via {result.provider}")
                return True, None

            else:
                # Send failed
                error_msg = result.error or "Unknown error"
                logger.error(f"Failed to send follow-up {followup_job_id}: {error_msg}")

                # Check if we should retry
                if retry_attempt < self.MAX_RETRY_ATTEMPTS:
                    # Schedule retry
                    delay = self.RETRY_DELAYS[retry_attempt]
                    retry_at = datetime.utcnow() + timedelta(seconds=delay)

                    logger.info(f"Will retry follow-up {followup_job_id} in {delay} seconds")

                    # Update scheduled_at for retry
                    followup_job.scheduled_at = retry_at
                    followup_job.updated_at = datetime.utcnow()
                    self.db.commit()

                    # Sleep and retry immediately (for worker)
                    # In production, worker would pick this up on next run
                    return False, f"Retry scheduled: {error_msg}"
                else:
                    # Max retries exceeded, mark as failed
                    self._mark_failed(followup_job, f"Max retries exceeded: {error_msg}")
                    return False, error_msg

        except Exception as e:
            error_msg = f"Unexpected error sending follow-up {followup_job_id}: {str(e)}"
            logger.exception(error_msg)

            # Try to mark as failed
            try:
                followup_job = self.db.query(FollowUpJob).filter(
                    FollowUpJob.id == followup_job_id
                ).first()
                if followup_job:
                    self._mark_failed(followup_job, str(e))
            except Exception as inner_e:
                logger.error(f"Failed to mark job as failed: {inner_e}")

            return False, error_msg

    def _mark_failed(self, followup_job: FollowUpJob, error_message: str):
        """Mark a follow-up job as failed"""
        followup_job.status = "failed"
        followup_job.updated_at = datetime.utcnow()
        # We could add an error_message field to store this
        logger.error(f"Follow-up job {followup_job.id} marked as failed: {error_message}")
        self.db.commit()

    def send_test_email(
        self,
        connection_id: int,
        to_email: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a test email to verify connection

        Args:
            connection_id: ID of the connection to test
            to_email: Email address to send test to

        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        try:
            # Get connection
            connection = self.db.query(Connection).filter(
                Connection.id == connection_id
            ).first()

            if not connection:
                return False, f"Connection {connection_id} not found"

            # Create test email
            html_body = EmailTemplate.create_test_email(
                to_email=to_email,
                from_name=connection.email
            )

            # Send email
            result = EmailService.send_email(
                connection=connection,
                to_email=to_email,
                subject="Test Email from Project Loom",
                html_body=html_body,
                from_name="Project Loom"
            )

            if result.success:
                logger.info(f"Test email sent successfully to {to_email}")
                return True, None
            else:
                logger.error(f"Test email failed: {result.error}")
                return False, result.error

        except Exception as e:
            error_msg = f"Test email error: {str(e)}"
            logger.exception(error_msg)
            return False, error_msg

    def retry_failed_followup(self, followup_job_id: int) -> Tuple[bool, Optional[str]]:
        """
        Manually retry a failed follow-up

        Args:
            followup_job_id: ID of the failed follow-up job

        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        try:
            followup_job = self.db.query(FollowUpJob).filter(
                FollowUpJob.id == followup_job_id
            ).first()

            if not followup_job:
                return False, f"Follow-up job {followup_job_id} not found"

            if followup_job.status not in ["failed", "pending"]:
                return False, f"Cannot retry job with status: {followup_job.status}"

            # Reset status to pending
            followup_job.status = "pending"
            followup_job.scheduled_at = datetime.utcnow()
            followup_job.updated_at = datetime.utcnow()
            self.db.commit()

            # Attempt to send
            return self.send_followup(followup_job_id, retry_attempt=0)

        except Exception as e:
            error_msg = f"Retry failed: {str(e)}"
            logger.exception(error_msg)
            return False, error_msg

    def get_pending_followups(self) -> list[FollowUpJob]:
        """
        Get all follow-ups that are ready to be sent

        Returns:
            List of pending follow-up jobs
        """
        now = datetime.utcnow()

        return self.db.query(FollowUpJob).filter(
            FollowUpJob.status == "pending",
            FollowUpJob.scheduled_at <= now
        ).all()
