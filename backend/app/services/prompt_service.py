from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.prompt import Prompt
from app.models.prompt_tag import PromptTag
from app.models.tag import Tag
from app.models.prompt_version import PromptVersion
from app.schemas.prompt import PromptCreate, PromptUpdate


def get_prompts(
    db: Session,
    user_id: UUID,
    q: Optional[str] = None,
    group_id: Optional[UUID] = None,
    tag: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    page: int = 1,
    page_size: int = 25,
):
    query = db.query(Prompt).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None)
    )

    if q:
        query = query.filter(
            Prompt.search_vector.op("@@")(func.websearch_to_tsquery("simple", q))
        )

    if group_id:
        query = query.filter(Prompt.group_id == group_id)

    if is_favorite is not None:
        query = query.filter(Prompt.is_favorite == is_favorite)

    if tag:
        query = (
            query
            .join(PromptTag, PromptTag.prompt_id == Prompt.id)
            .join(Tag, Tag.id == PromptTag.tag_id)
            .filter(Tag.name == tag)
        )

    total = query.distinct().count()
    items = (
        query.options(selectinload(Prompt.tags))
        .distinct()
        .order_by(Prompt.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, {
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": page * page_size < total,
    }


def get_prompt_by_id(db: Session, prompt_id: UUID, user_id: UUID):
    return db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None)
    ).first()


def get_or_create_tag(db: Session, tag_name: str, user_id: UUID):
    tag = db.query(Tag).filter(
        Tag.name == tag_name,
        Tag.user_id == user_id
    ).first()

    if tag:
        return tag

    new_tag = Tag(
        name=tag_name,
        user_id=user_id
    )

    db.add(new_tag)
    db.flush()

    return new_tag


def record_version(db: Session, prompt: Prompt, user_id: UUID) -> PromptVersion:
    latest = db.query(func.max(PromptVersion.version_number)).filter(
        PromptVersion.prompt_id == prompt.id,
        PromptVersion.user_id == user_id,
    ).scalar() or 0
    version = PromptVersion(
        prompt_id=prompt.id,
        user_id=user_id,
        version_number=latest + 1,
        title=prompt.title,
        description=prompt.description,
        prompt_content=prompt.prompt_content,
        group_id=prompt.group_id,
        is_favorite=prompt.is_favorite,
        variables=prompt.variables or {},
        tags=[tag.name for tag in prompt.tags],
    )
    db.add(version)
    return version


def attach_tags_to_prompt(
    db: Session,
    prompt: Prompt,
    tag_names: list[str],
    user_id: UUID
):
    db.query(PromptTag).filter(
        PromptTag.prompt_id == prompt.id
    ).delete()

    for tag_name in tag_names:
        clean_name = tag_name.strip()

        if not clean_name:
            continue

        tag = get_or_create_tag(db, clean_name, user_id)

        prompt_tag = PromptTag(
            prompt_id=prompt.id,
            tag_id=tag.id
        )

        db.add(prompt_tag)

def create_prompt(db: Session, prompt_data: PromptCreate, user_id: UUID):
    new_prompt = Prompt(
        user_id=user_id,
        group_id=prompt_data.group_id,
        title=prompt_data.title,
        description=prompt_data.description,
        prompt_content=prompt_data.prompt_content,
        variables=prompt_data.variables,
    )

    try:
        db.add(new_prompt)
        db.flush()
        attach_tags_to_prompt(db, new_prompt, prompt_data.tag_names, user_id)
        record_version(db, new_prompt, user_id)
        db.commit()
        db.refresh(new_prompt)
        return new_prompt
    except Exception:
        db.rollback()
        raise


def update_prompt(
    db: Session,
    prompt: Prompt,
    prompt_data: PromptUpdate,
    user_id: UUID
):
    update_data = prompt_data.model_dump(exclude_unset=True)

    tag_names = update_data.pop("tag_names", None)

    for field, value in update_data.items():
        setattr(prompt, field, value)

    try:
        if tag_names is not None:
            attach_tags_to_prompt(db, prompt, tag_names, user_id)
        db.flush()
        record_version(db, prompt, user_id)
        db.commit()
        db.refresh(prompt)
        return prompt
    except Exception:
        db.rollback()
        raise


def soft_delete_prompt(db: Session, prompt: Prompt):
    prompt.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(prompt)

    return prompt


def duplicate_prompt(db: Session, prompt: Prompt, user_id: UUID):
    new_prompt = Prompt(
        user_id=user_id,
        group_id=prompt.group_id,
        title=f"{prompt.title} Copy",
        description=prompt.description,
        prompt_content=prompt.prompt_content,
        is_favorite=prompt.is_favorite,
        variables=prompt.variables or {},
    )

    try:
        db.add(new_prompt)
        db.flush()
        attach_tags_to_prompt(
            db, new_prompt, [tag.name for tag in prompt.tags], user_id
        )
        record_version(db, new_prompt, user_id)
        db.commit()
        db.refresh(new_prompt)
        return new_prompt
    except Exception:
        db.rollback()
        raise


def mark_prompt_used(db: Session, prompt: Prompt):
    prompt.usage_count += 1
    prompt.last_used_at = datetime.utcnow()

    db.commit()
    db.refresh(prompt)

    return prompt


def set_prompt_favorite(db: Session, prompt: Prompt, is_favorite: bool):
    try:
        prompt.is_favorite = is_favorite
        record_version(db, prompt, prompt.user_id)
        db.commit()
        db.refresh(prompt)
        return prompt
    except Exception:
        db.rollback()
        raise


def get_trash(db: Session, user_id: UUID, page: int = 1, page_size: int = 25):
    query = db.query(Prompt).options(selectinload(Prompt.tags)).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_not(None),
    )
    total = query.count()
    items = query.order_by(Prompt.deleted_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, {"page": page, "page_size": page_size, "total": total, "has_next": page * page_size < total}


def restore_prompt(db: Session, prompt: Prompt):
    prompt.deleted_at = None
    db.commit()
    db.refresh(prompt)
    return prompt


def get_versions(db: Session, prompt_id: UUID, user_id: UUID):
    return db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id,
        PromptVersion.user_id == user_id,
    ).order_by(PromptVersion.version_number.desc()).all()


def restore_version(db: Session, prompt: Prompt, version: PromptVersion, user_id: UUID):
    prompt.title = version.title
    prompt.description = version.description
    prompt.prompt_content = version.prompt_content
    prompt.group_id = version.group_id
    prompt.is_favorite = version.is_favorite
    prompt.variables = version.variables or {}
    attach_tags_to_prompt(db, prompt, version.tags or [], user_id)
    record_version(db, prompt, user_id)
    db.commit()
    db.refresh(prompt)
    return prompt


def bulk_update(db: Session, user_id: UUID, payload):
    prompts = db.query(Prompt).filter(Prompt.user_id == user_id, Prompt.id.in_(payload.prompt_ids)).all()
    for prompt in prompts:
        if payload.action == "delete":
            prompt.deleted_at = datetime.utcnow()
        elif payload.action == "restore":
            prompt.deleted_at = None
        elif payload.action in {"favorite", "unfavorite"}:
            prompt.is_favorite = payload.action == "favorite"
        elif payload.action == "move":
            prompt.group_id = payload.group_id
        elif payload.action == "tag":
            attach_tags_to_prompt(db, prompt, payload.tag_names, user_id)
    db.commit()
    return len(prompts)
