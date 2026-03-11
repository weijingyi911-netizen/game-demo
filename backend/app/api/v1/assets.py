import secrets
import time
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile


router = APIRouter()


def _project_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _safe_ext(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        return ext
    return ""


@router.post("/upload")
async def upload_asset(
    asset_type: str = Form(...),
    name: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    asset_type = (asset_type or "").strip().lower()
    if asset_type not in {"background", "character", "prop"}:
        raise HTTPException(status_code=400, detail="invalid asset_type")

    ext = _safe_ext(file.filename or "")
    if not ext:
        raise HTTPException(status_code=400, detail="unsupported file type")

    asset_id = f"{asset_type}_{int(time.time() * 1000)}_{secrets.token_hex(4)}"
    rel_path = Path("assets") / asset_type / f"{asset_id}{ext}"

    public_dir = _project_root() / "public"
    dst_path = public_dir / rel_path
    dst_path.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="empty file")

    dst_path.write_bytes(content)

    return {
        "id": asset_id,
        "type": asset_type,
        "name": (name or "").strip() or (file.filename or asset_id),
        "url": "/" + str(rel_path).replace("\\", "/"),
    }
