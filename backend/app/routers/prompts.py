import csv
import io
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.group import Group
from app.schemas.prompt import PromptCreate, PromptResponse, PromptUpdate, PromptVersionResponse
from app.schemas.product import BulkPromptRequest, ImportPromptsRequest
from app.schemas.search import PromptPage
from app.schemas.common import CollectionResponse, PageResponse
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
    if prompt_data.group_id and not db.query(Group).filter(
        Group.id == prompt_data.group_id,
        Group.user_id == current_user.id,
    ).first():
        raise HTTPException(status_code=400, detail="Group not found")

    return prompt_service.create_prompt(
        db=db,
        prompt_data=prompt_data,
        user_id=current_user.id
    )


@router.get("/", response_model=PromptPage)
def list_prompts(
    q: str | None = None,
    group_id: UUID | None = None,
    tag: str | None = None,
    is_favorite: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, meta = prompt_service.get_prompts(
        db=db,
        user_id=current_user.id,
        q=q,
        group_id=group_id,
        tag=tag,
        is_favorite=is_favorite,
        page=page,
        page_size=page_size,
    )
    return {"data": items, "meta": meta}


@router.get("/trash", response_model=PromptPage)
def list_trash(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, meta = prompt_service.get_trash(db, current_user.id, page, page_size)
    return {"data": items, "meta": meta}


@router.get("/discover/{kind}", response_model=CollectionResponse[PromptResponse])
def discover_prompts(kind: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(prompt_service.Prompt).options(prompt_service.selectinload(prompt_service.Prompt.tags)).filter(
        prompt_service.Prompt.user_id == current_user.id,
        prompt_service.Prompt.deleted_at.is_(None),
    )
    if kind == "most-used":
        query = query.order_by(prompt_service.Prompt.usage_count.desc(), prompt_service.Prompt.updated_at.desc())
    elif kind == "recently-edited":
        query = query.order_by(prompt_service.Prompt.updated_at.desc())
    elif kind == "favorites":
        query = query.filter(prompt_service.Prompt.is_favorite.is_(True)).order_by(prompt_service.Prompt.updated_at.desc())
    elif kind == "recent":
        query = query.order_by(prompt_service.Prompt.created_at.desc())
    else:
        raise HTTPException(status_code=404, detail="Unknown discovery category")
    items = query.limit(20).all()
    return {"data": items, "meta": {"total": len(items)}}


@router.post("/bulk")
def bulk_prompts(
    payload: BulkPromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.action == "move" and payload.group_id and not db.query(Group).filter(
        Group.id == payload.group_id, Group.user_id == current_user.id
    ).first():
        raise HTTPException(status_code=400, detail="Group not found")
    return {"updated": prompt_service.bulk_update(db, current_user.id, payload)}


@router.post("/import")
def import_prompts(
    payload: ImportPromptsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = []
    for item in payload.prompts:
        content = item.get("prompt_content") or item.get("content") or item.get("text")
        if not content:
            continue
        prompt = PromptCreate(
            title=item.get("title") or "Imported prompt",
            description=item.get("description"),
            prompt_content=content,
            tag_names=item.get("tag_names") or item.get("tags") or [],
            variables=item.get("variables") or {},
        )
        created.append(prompt_service.create_prompt(db, prompt, current_user.id))
    return {"created": len(created)}


@router.get("/export")
def export_prompts(
    format: str = Query("json", pattern="^(json|markdown|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(prompt_service.Prompt).filter(
        prompt_service.Prompt.user_id == current_user.id,
        prompt_service.Prompt.deleted_at.is_(None),
    ).order_by(prompt_service.Prompt.created_at.desc()).all()
    if format == "json":
        body = json.dumps([{
            "title": p.title, "description": p.description, "prompt_content": p.prompt_content,
            "group_id": str(p.group_id) if p.group_id else None,
            "variables": p.variables or {}, "tags": [tag.name for tag in p.tags],
        } for p in items], default=str, indent=2)
        return Response(body, media_type="application/json", headers={"Content-Disposition": "attachment; filename=promptnest.json"})
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["title", "description", "prompt_content", "tags"])
        for p in items:
            writer.writerow([p.title, p.description or "", p.prompt_content, ", ".join(tag.name for tag in p.tags)])
        return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=promptnest.csv"})
    body = "\n\n".join(f"# {p.title}\n\n{p.description or ''}\n\n```text\n{p.prompt_content}\n```" for p in items)
    return Response(body, media_type="text/markdown", headers={"Content-Disposition": "attachment; filename=promptnest.md"})


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


@router.get("/{prompt_id}/versions", response_model=CollectionResponse[PromptVersionResponse])
def prompt_versions(prompt_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not prompt_service.get_prompt_by_id(db, prompt_id, current_user.id):
        raise HTTPException(status_code=404, detail="Prompt not found")
    versions = prompt_service.get_versions(db, prompt_id, current_user.id)
    return {"data": versions, "meta": {"total": len(versions)}}


@router.post("/{prompt_id}/restore", response_model=PromptResponse)
def restore_deleted_prompt(prompt_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prompt = db.query(prompt_service.Prompt).filter(
        prompt_service.Prompt.id == prompt_id,
        prompt_service.Prompt.user_id == current_user.id,
        prompt_service.Prompt.deleted_at.is_not(None),
    ).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Deleted prompt not found")
    return prompt_service.restore_prompt(db, prompt)


@router.post("/{prompt_id}/versions/{version_id}/restore", response_model=PromptResponse)
def restore_prompt_version(prompt_id: UUID, version_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prompt = prompt_service.get_prompt_by_id(db, prompt_id, current_user.id)
    version = db.query(prompt_service.PromptVersion).filter(
        prompt_service.PromptVersion.id == version_id,
        prompt_service.PromptVersion.prompt_id == prompt_id,
        prompt_service.PromptVersion.user_id == current_user.id,
    ).first()
    if not prompt or not version:
        raise HTTPException(status_code=404, detail="Prompt version not found")
    return prompt_service.restore_version(db, prompt, version, current_user.id)


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

    if prompt_data.group_id and not db.query(Group).filter(
        Group.id == prompt_data.group_id,
        Group.user_id == current_user.id,
    ).first():
        raise HTTPException(status_code=400, detail="Group not found")

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

    return prompt_service.set_prompt_favorite(db, prompt, True)


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

    return prompt_service.set_prompt_favorite(db, prompt, False)
