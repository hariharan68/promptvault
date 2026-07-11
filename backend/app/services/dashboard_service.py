from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.group import Group
from app.models.prompt import Prompt


def get_dashboard_stats(db: Session, user_id):
    total = db.query(func.count(Prompt.id)).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None),
    ).scalar() or 0
    favorites = db.query(func.count(Prompt.id)).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None),
        Prompt.is_favorite.is_(True),
    ).scalar() or 0
    groups = db.query(func.count(Group.id)).filter(Group.user_id == user_id).scalar() or 0
    return {"total": total, "favorites": favorites, "groups": groups}


def get_recent_prompts(db: Session, user_id, limit: int = 5):
    return db.query(Prompt).options(selectinload(Prompt.tags)).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None),
    ).order_by(Prompt.created_at.desc()).limit(limit).all()
