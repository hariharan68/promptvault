from uuid import UUID

from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate


def get_tags(db: Session, user_id: UUID):
    return (
        db.query(Tag)
        .filter(Tag.user_id == user_id)
        .order_by(Tag.name.asc())
        .all()
    )


def get_tag_by_id(db: Session, tag_id: UUID, user_id: UUID):
    return (
        db.query(Tag)
        .filter(Tag.id == tag_id, Tag.user_id == user_id)
        .first()
    )


def get_tag_by_name(db: Session, name: str, user_id: UUID):
    return (
        db.query(Tag)
        .filter(Tag.name == name, Tag.user_id == user_id)
        .first()
    )


def create_tag(db: Session, tag_data: TagCreate, user_id: UUID):
    tag = Tag(
        user_id=user_id,
        name=tag_data.name
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)

    return tag