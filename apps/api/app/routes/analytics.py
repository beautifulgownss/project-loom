"""API routes for analytics."""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.followup_job import FollowUpJob
from app.models.sequence import Sequence, SequenceEnrollment
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_analytics_overview(
    date_range: Optional[int] = Query(30, description="Number of days to look back (7, 30, 90, or None for all time)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get overview analytics statistics."""

    # Build base query
    query = db.query(FollowUpJob).filter(FollowUpJob.user_id == current_user.id)

    # Apply date range filter
    if date_range:
        start_date = datetime.utcnow() - timedelta(days=date_range)
        query = query.filter(FollowUpJob.created_at >= start_date)

    # Total follow-ups
    total_followups = query.count()

    # Sent follow-ups
    sent_followups = query.filter(FollowUpJob.status == "sent").count()

    # Replied follow-ups
    replied_followups = query.filter(FollowUpJob.status == "replied").count()

    # Reply rate
    reply_rate = (replied_followups / sent_followups * 100) if sent_followups > 0 else 0

    # Average response time (in hours)
    response_times = (
        db.query(
            func.extract('epoch', FollowUpJob.reply_received_at - FollowUpJob.sent_at) / 3600
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.status == "replied",
            FollowUpJob.sent_at.isnot(None),
            FollowUpJob.reply_received_at.isnot(None),
        )
    )

    if date_range:
        start_date = datetime.utcnow() - timedelta(days=date_range)
        response_times = response_times.filter(FollowUpJob.created_at >= start_date)

    avg_response_time = response_times.scalar() or 0

    # Active sequences
    active_sequences = db.query(Sequence).filter(
        Sequence.user_id == current_user.id,
        Sequence.is_active == True
    ).count()

    # Active sequence enrollments
    active_enrollments = db.query(SequenceEnrollment).filter(
        SequenceEnrollment.user_id == current_user.id,
        SequenceEnrollment.status == "active"
    ).count()

    return {
        "total_followups": total_followups,
        "sent_followups": sent_followups,
        "replied_followups": replied_followups,
        "reply_rate": round(reply_rate, 1),
        "avg_response_time_hours": round(avg_response_time, 1),
        "active_sequences": active_sequences,
        "active_enrollments": active_enrollments,
    }


@router.get("/trends")
async def get_analytics_trends(
    date_range: Optional[int] = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get time-series trend data for charts."""

    days = date_range or 30
    start_date = datetime.utcnow() - timedelta(days=days)

    # Follow-ups sent over time (daily)
    daily_stats = (
        db.query(
            func.date(FollowUpJob.sent_at).label("date"),
            func.count(FollowUpJob.id).label("count")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.sent_at >= start_date,
            FollowUpJob.status == "sent"
        )
        .group_by(func.date(FollowUpJob.sent_at))
        .order_by(func.date(FollowUpJob.sent_at))
        .all()
    )

    followups_over_time = [
        {"date": str(stat.date), "count": stat.count}
        for stat in daily_stats
    ]

    # Reply rates by tone
    tone_stats = (
        db.query(
            FollowUpJob.tone,
            func.count(FollowUpJob.id).label("total"),
            func.sum(case((FollowUpJob.status == "replied", 1), else_=0)).label("replied")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.created_at >= start_date,
            FollowUpJob.status.in_(["sent", "replied"])
        )
        .group_by(FollowUpJob.tone)
        .all()
    )

    reply_rates_by_tone = [
        {
            "tone": stat.tone,
            "total": stat.total,
            "replied": stat.replied,
            "reply_rate": round((stat.replied / stat.total * 100) if stat.total > 0 else 0, 1)
        }
        for stat in tone_stats
    ]

    # Status distribution
    status_stats = (
        db.query(
            FollowUpJob.status,
            func.count(FollowUpJob.id).label("count")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.created_at >= start_date
        )
        .group_by(FollowUpJob.status)
        .all()
    )

    status_distribution = [
        {"status": stat.status, "count": stat.count}
        for stat in status_stats
    ]

    # Performance by day of week
    day_of_week_stats = (
        db.query(
            extract('dow', FollowUpJob.sent_at).label("day_of_week"),
            func.count(FollowUpJob.id).label("total"),
            func.sum(case((FollowUpJob.status == "replied", 1), else_=0)).label("replied")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.sent_at >= start_date,
            FollowUpJob.status.in_(["sent", "replied"])
        )
        .group_by(extract('dow', FollowUpJob.sent_at))
        .order_by(extract('dow', FollowUpJob.sent_at))
        .all()
    )

    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    performance_by_day = [
        {
            "day": day_names[int(stat.day_of_week)],
            "total": stat.total,
            "replied": stat.replied,
            "reply_rate": round((stat.replied / stat.total * 100) if stat.total > 0 else 0, 1)
        }
        for stat in day_of_week_stats
    ]

    return {
        "followups_over_time": followups_over_time,
        "reply_rates_by_tone": reply_rates_by_tone,
        "status_distribution": status_distribution,
        "performance_by_day": performance_by_day,
    }


@router.get("/insights")
async def get_analytics_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated insights and recommendations."""

    # Get last 30 days of data for insights
    start_date = datetime.utcnow() - timedelta(days=30)

    # Best performing tone
    tone_stats = (
        db.query(
            FollowUpJob.tone,
            func.count(FollowUpJob.id).label("total"),
            func.sum(case((FollowUpJob.status == "replied", 1), else_=0)).label("replied")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.created_at >= start_date,
            FollowUpJob.status.in_(["sent", "replied"])
        )
        .group_by(FollowUpJob.tone)
        .all()
    )

    best_tone = None
    best_reply_rate = 0
    for stat in tone_stats:
        if stat.total >= 5:  # Only consider tones with at least 5 sends
            reply_rate = (stat.replied / stat.total * 100) if stat.total > 0 else 0
            if reply_rate > best_reply_rate:
                best_reply_rate = reply_rate
                best_tone = stat.tone

    # Best day of week
    day_stats = (
        db.query(
            extract('dow', FollowUpJob.sent_at).label("day_of_week"),
            func.count(FollowUpJob.id).label("total"),
            func.sum(case((FollowUpJob.status == "replied", 1), else_=0)).label("replied")
        )
        .filter(
            FollowUpJob.user_id == current_user.id,
            FollowUpJob.sent_at >= start_date,
            FollowUpJob.status.in_(["sent", "replied"])
        )
        .group_by(extract('dow', FollowUpJob.sent_at))
        .all()
    )

    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    best_day = None
    best_day_reply_rate = 0
    for stat in day_stats:
        if stat.total >= 3:
            reply_rate = (stat.replied / stat.total * 100) if stat.total > 0 else 0
            if reply_rate > best_day_reply_rate:
                best_day_reply_rate = reply_rate
                best_day = day_names[int(stat.day_of_week)]

    # Generate insights
    insights = []

    if best_tone:
        insights.append({
            "type": "success",
            "title": "Best Performing Tone",
            "message": f"Your '{best_tone}' tone has a {best_reply_rate:.1f}% reply rate. Consider using this tone more often.",
            "icon": "💡"
        })

    if best_day:
        insights.append({
            "type": "info",
            "title": "Optimal Send Day",
            "message": f"Emails sent on {best_day} have the highest reply rate ({best_day_reply_rate:.1f}%). Schedule important follow-ups for this day.",
            "icon": "📅"
        })

    # Check for pending follow-ups
    pending_count = db.query(FollowUpJob).filter(
        FollowUpJob.user_id == current_user.id,
        FollowUpJob.status == "pending"
    ).count()

    if pending_count > 10:
        insights.append({
            "type": "warning",
            "title": "Pending Follow-ups",
            "message": f"You have {pending_count} pending follow-ups. Review and schedule them to maintain engagement.",
            "icon": "⚠️"
        })

    # Check active sequences
    active_sequences = db.query(Sequence).filter(
        Sequence.user_id == current_user.id,
        Sequence.is_active == True
    ).count()

    if active_sequences == 0:
        insights.append({
            "type": "tip",
            "title": "Try Sequences",
            "message": "Create multi-step sequences to automate your follow-up process and increase response rates.",
            "icon": "🚀"
        })

    return {
        "insights": insights,
        "best_tone": best_tone,
        "best_day": best_day,
    }
