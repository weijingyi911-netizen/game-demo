from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import StoryProject, StoryDraft, StoryRelease, StoryAsset, generate_uuid
from app.schemas.story import (
    StoryProjectCreate,
    StoryProjectOut,
    StoryDraftOut,
    StoryDraftUpsert,
    StoryReleaseCreate,
    StoryReleaseOut,
    StoryRollbackIn,
    StoryAssetOut,
    StoryReleaseListOut,
)

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"


@router.get("/projects", response_model=List[StoryProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoryProject).order_by(desc(StoryProject.updated_at)))
    return result.scalars().all()


@router.post("/projects", response_model=StoryProjectOut)
async def create_project(payload: StoryProjectCreate, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    project = StoryProject(id=generate_uuid(), name=payload.name, created_at=now, updated_at=now)
    db.add(project)
    await db.commit()
    await db.refresh(project)

    draft = StoryDraft(
        id=generate_uuid(),
        project_id=project.id,
        yaml="chapters:\n  start:\n    name: 第一章\n    start_node: start_0\n    scenes:\n      - id: start_0\n        type: dialogue\n        speaker: \"旁白\"\n        text: \"开始\"\n",
        created_at=now,
        updated_at=now,
    )
    db.add(draft)
    await db.commit()
    return project


@router.get("/projects/{project_id}/draft", response_model=StoryDraftOut)
async def get_draft(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoryDraft).where(StoryDraft.project_id == project_id))
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return StoryDraftOut(project_id=project_id, yaml=draft.yaml, updated_at=draft.updated_at)


@router.put("/projects/{project_id}/draft", response_model=StoryDraftOut)
async def upsert_draft(project_id: str, payload: StoryDraftUpsert, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    project_result = await db.execute(select(StoryProject).where(StoryProject.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(StoryDraft).where(StoryDraft.project_id == project_id))
    draft = result.scalar_one_or_none()
    if not draft:
        draft = StoryDraft(id=generate_uuid(), project_id=project_id, yaml=payload.yaml, created_at=now, updated_at=now)
        db.add(draft)
    else:
        draft.yaml = payload.yaml
        draft.updated_at = now
    project.updated_at = now
    await db.commit()
    return StoryDraftOut(project_id=project_id, yaml=draft.yaml, updated_at=draft.updated_at)


@router.post("/projects/{project_id}/release", response_model=StoryReleaseOut)
async def create_release(project_id: str, payload: StoryReleaseCreate, db: AsyncSession = Depends(get_db)):
    project_result = await db.execute(select(StoryProject).where(StoryProject.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    draft_result = await db.execute(select(StoryDraft).where(StoryDraft.project_id == project_id))
    draft = draft_result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    version_result = await db.execute(
        select(func.max(StoryRelease.version)).where(StoryRelease.project_id == project_id)
    )
    max_version = version_result.scalar_one_or_none() or 0
    next_version = int(max_version) + 1

    release = StoryRelease(
        id=generate_uuid(),
        project_id=project_id,
        version=next_version,
        note=payload.note,
        yaml=draft.yaml,
        created_at=datetime.utcnow(),
    )
    db.add(release)
    project.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(release)
    return release


@router.get("/projects/{project_id}/releases", response_model=StoryReleaseListOut)
async def list_releases(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StoryRelease).where(StoryRelease.project_id == project_id).order_by(desc(StoryRelease.version))
    )
    items = result.scalars().all()
    return StoryReleaseListOut(items=items)


@router.post("/projects/{project_id}/rollback", response_model=StoryDraftOut)
async def rollback_to_release(project_id: str, payload: StoryRollbackIn, db: AsyncSession = Depends(get_db)):
    project_result = await db.execute(select(StoryProject).where(StoryProject.id == project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    release_result = await db.execute(
        select(StoryRelease).where(StoryRelease.project_id == project_id).where(StoryRelease.id == payload.release_id)
    )
    release = release_result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")

    now = datetime.utcnow()
    draft_result = await db.execute(select(StoryDraft).where(StoryDraft.project_id == project_id))
    draft = draft_result.scalar_one_or_none()
    if not draft:
        draft = StoryDraft(id=generate_uuid(), project_id=project_id, yaml=release.yaml, created_at=now, updated_at=now)
        db.add(draft)
    else:
        draft.yaml = release.yaml
        draft.updated_at = now
    project.updated_at = now
    await db.commit()
    return StoryDraftOut(project_id=project_id, yaml=draft.yaml, updated_at=draft.updated_at)


@router.post("/assets/upload", response_model=StoryAssetOut)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix
    file_name = f"{generate_uuid()}{ext}"
    file_path = UPLOAD_DIR / file_name

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    asset = StoryAsset(
        id=generate_uuid(),
        project_id=project_id,
        original_name=file.filename,
        file_name=file_name,
        content_type=file.content_type,
        size=len(content),
        url=f"/uploads/{file_name}",
        created_at=datetime.utcnow(),
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset
