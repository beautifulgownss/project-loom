"""
Background Worker for Project Loom

Processes scheduled follow-up emails and sends them at the appropriate time.
Runs as a separate process alongside the API server.

Usage:
    python worker.py

The worker runs continuously, checking every 5 minutes for pending follow-ups
that are ready to be sent.
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.followup_sender import FollowUpSender

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('worker.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Worker configuration
CHECK_INTERVAL_SECONDS = 300  # 5 minutes
BATCH_SIZE = 50  # Max follow-ups to process per run


def process_pending_followups(db: Session) -> dict:
    """
    Process all pending follow-ups that are ready to be sent

    Args:
        db: Database session

    Returns:
        Dictionary with processing statistics
    """
    sender = FollowUpSender(db)

    # Get all pending follow-ups
    pending_jobs = sender.get_pending_followups()

    stats = {
        "total_pending": len(pending_jobs),
        "sent": 0,
        "failed": 0,
        "errors": []
    }

    logger.info(f"Found {len(pending_jobs)} pending follow-ups to process")

    # Process each follow-up
    for job in pending_jobs[:BATCH_SIZE]:
        logger.info(
            f"Processing follow-up {job.id}: "
            f"to={job.original_recipient}, "
            f"subject={job.draft_subject}"
        )

        try:
            success, error_msg = sender.send_followup(job.id)

            if success:
                stats["sent"] += 1
                logger.info(f"✓ Successfully sent follow-up {job.id}")
            else:
                stats["failed"] += 1
                stats["errors"].append(f"Job {job.id}: {error_msg}")
                logger.warning(f"✗ Failed to send follow-up {job.id}: {error_msg}")

        except Exception as e:
            stats["failed"] += 1
            error_msg = f"Unexpected error processing job {job.id}: {str(e)}"
            stats["errors"].append(error_msg)
            logger.exception(error_msg)

    return stats


def run_worker():
    """
    Main worker loop

    Runs continuously, checking for pending follow-ups every CHECK_INTERVAL_SECONDS
    """
    logger.info("=" * 80)
    logger.info("Project Loom Background Worker Starting")
    logger.info(f"Check interval: {CHECK_INTERVAL_SECONDS} seconds ({CHECK_INTERVAL_SECONDS / 60} minutes)")
    logger.info(f"Batch size: {BATCH_SIZE}")
    logger.info("=" * 80)

    iteration = 0

    while True:
        iteration += 1
        start_time = datetime.utcnow()

        logger.info(f"\n{'=' * 80}")
        logger.info(f"Worker iteration #{iteration} - {start_time.isoformat()}")
        logger.info(f"{'=' * 80}")

        db = SessionLocal()

        try:
            stats = process_pending_followups(db)

            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            logger.info(f"\n{'=' * 80}")
            logger.info(f"Iteration #{iteration} Complete")
            logger.info(f"Duration: {duration:.2f} seconds")
            logger.info(f"Results:")
            logger.info(f"  - Total pending: {stats['total_pending']}")
            logger.info(f"  - Successfully sent: {stats['sent']}")
            logger.info(f"  - Failed: {stats['failed']}")

            if stats['errors']:
                logger.warning(f"  - Errors:")
                for error in stats['errors'][:10]:  # Show first 10 errors
                    logger.warning(f"    • {error}")

            logger.info(f"{'=' * 80}\n")

        except Exception as e:
            logger.exception(f"Worker error in iteration #{iteration}: {str(e)}")

        finally:
            db.close()

        # Wait before next iteration
        logger.info(f"Sleeping for {CHECK_INTERVAL_SECONDS} seconds...")
        time.sleep(CHECK_INTERVAL_SECONDS)


def run_once():
    """
    Run the worker once and exit (useful for testing or cron jobs)
    """
    logger.info("Running worker in single-run mode")

    db = SessionLocal()

    try:
        stats = process_pending_followups(db)

        logger.info("Single run complete:")
        logger.info(f"  - Total pending: {stats['total_pending']}")
        logger.info(f"  - Successfully sent: {stats['sent']}")
        logger.info(f"  - Failed: {stats['failed']}")

        if stats['errors']:
            logger.warning("Errors:")
            for error in stats['errors']:
                logger.warning(f"  - {error}")

        return 0 if stats['failed'] == 0 else 1

    except Exception as e:
        logger.exception(f"Worker error: {str(e)}")
        return 1

    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Project Loom Background Worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run once and exit (instead of continuous loop)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=CHECK_INTERVAL_SECONDS,
        help=f"Check interval in seconds (default: {CHECK_INTERVAL_SECONDS})"
    )

    args = parser.parse_args()

    if args.interval:
        CHECK_INTERVAL_SECONDS = args.interval

    try:
        if args.once:
            exit_code = run_once()
            sys.exit(exit_code)
        else:
            run_worker()
    except KeyboardInterrupt:
        logger.info("\nWorker stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.exception(f"Fatal worker error: {str(e)}")
        sys.exit(1)
