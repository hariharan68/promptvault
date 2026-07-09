from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.prompt import PromptCreate, PromptResponse, PromptUpdate
from app.services import prompt_service


router = APIRouter(
    prefix="/api/v1/prompts",
    tags=["Prompts"]
)


@router.post("/", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_new_prompt(
    prompt_data: PromptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return prompt_service.create_prompt(
        db=db,
        prompt_data=prompt_data,
        user_id=current_user.id
    )


@router.get("/", response_model=list[PromptResponse])
def list_prompts(
    q: str | None = None,
    group_id: UUID | None = None,
    tag: str | None = None,
    is_favorite: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return prompt_service.get_prompts(
        db=db,
        user_id=current_user.id,
        q=q,
        group_id=group_id,
        tag=tag,
        is_favorite=is_favorite,
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_single_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_existing_prompt(
    prompt_id: UUID,
    prompt_data: PromptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt_service.update_prompt(
        db=db,
        prompt=prompt,
        prompt_data=prompt_data,
        user_id=current_user.id
    )


@router.delete("/{prompt_id}")
def delete_existing_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    prompt_service.soft_delete_prompt(db=db, prompt=prompt)

    return {
        "message": "Prompt deleted successfully"
    }


@router.post("/{prompt_id}/duplicate", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def duplicate_existing_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt_service.duplicate_prompt(
        db=db,
        prompt=prompt,
        user_id=current_user.id
    )


@router.post("/{prompt_id}/copy", response_model=PromptResponse)
def copy_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt_service.mark_prompt_used(
        db=db,
        prompt=prompt
    )


@router.post("/{prompt_id}/favorite", response_model=PromptResponse)
def favorite_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    prompt.is_favorite = True
    db.commit()
    db.refresh(prompt)

    return prompt


@router.delete("/{prompt_id}/favorite", response_model=PromptResponse)
def unfavorite_prompt(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = prompt_service.get_prompt_by_id(
        db=db,
        prompt_id=prompt_id,
        user_id=current_user.id
    )

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    prompt.is_favorite = False
    db.commit()
    db.refresh(prompt)

    return prompt
