from uuid import UUID

from sqlalchemy.orm import Session

from app.models.group import Group
from app.schemas.group import GroupCreate, GroupUpdate


def get_groups(db: Session, user_id: UUID):
    return (
        db.query(Group)
        .filter(Group.user_id == user_id)
        .order_by(Group.created_at.desc())
        .all()
    )


def get_group_by_id(db: Session, group_id: UUID, user_id: UUID):
    return (
        db.query(Group)
        .filter(Group.id == group_id, Group.user_id == user_id)
        .first()
    )


def get_group_by_name(db: Session, name: str, user_id: UUID):
    return (
        db.query(Group)
        .filter(Group.name == name, Group.user_id == user_id)
        .first()
    )


def create_group(db: Session, group_data: GroupCreate, user_id: UUID):
    group = Group(
        user_id=user_id,
        name=group_data.name,
        description=group_data.description
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


def update_group(db: Session, group: Group, group_data: GroupUpdate):
    update_data = group_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)

    return group


def delete_group(db: Session, group: Group):
    db.delete(group)
    db.commit()
    return True