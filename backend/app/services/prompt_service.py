from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.prompt_tag import PromptTag
from app.models.tag import Tag
from app.schemas.prompt import PromptCreate, PromptUpdate


def get_prompts(
    db: Session,
    user_id: UUID,
    q: Optional[str] = None,
    group_id: Optional[UUID] = None,
    tag: Optional[str] = None,
    is_favorite: Optional[bool] = None,
):
    query = db.query(Prompt).filter(
        Prompt.user_id == user_id,
        Prompt.deleted_at.is_(None)
    )

    if q:
        search_text = f"%{q}%"
        query = query.filter(
            or_(
                Prompt.title.ilike(search_text),
                Prompt.description.ilike(search_text),
                Prompt.prompt_content.ilike(search_text),
            )
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

    return query.order_by(Prompt.created_at.desc()).all()


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
    db.commit()
    db.refresh(new_tag)

    return new_tag


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

    db.commit()


def create_prompt(db: Session, prompt_data: PromptCreate, user_id: UUID):
    new_prompt = Prompt(
        user_id=user_id,
        group_id=prompt_data.group_id,
        title=prompt_data.title,
        description=prompt_data.description,
        prompt_content=prompt_data.prompt_content,
    )

    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)

    attach_tags_to_prompt(
        db=db,
        prompt=new_prompt,
        tag_names=prompt_data.tag_names,
        user_id=user_id
    )

    return new_prompt


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

    db.commit()
    db.refresh(prompt)

    if tag_names is not None:
        attach_tags_to_prompt(
            db=db,
            prompt=prompt,
            tag_names=tag_names,
            user_id=user_id
        )

    return prompt


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
    )

    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)

    return new_prompt


def mark_prompt_used(db: Session, prompt: Prompt):
    prompt.usage_count += 1
    prompt.last_used_at = datetime.utcnow()

    db.commit()
    db.refresh(prompt)

    return prompt