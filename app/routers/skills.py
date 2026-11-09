from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
from app.database.db import get_connection
from app.errors import raise_http_from_db
from app.security import require_role
from app.schemas.skill_schema import SkillCreate

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_skill(payload: SkillCreate, conn: Any = Depends(get_connection),current_user=Depends(require_role("admin"))):
    try:
        row = await conn.fetchrow(
            "INSERT INTO skill (skill_name) VALUES ($1) RETURNING skill_id, skill_name;",
            payload.skill_name,
        )
        return dict(row)
    except Exception as e:
        raise_http_from_db(e, unique_msg="Skill name already exists")


@router.get("")
async def list_skills(conn: Any = Depends(get_connection)):
    rows = await conn.fetch("SELECT skill_id, skill_name FROM skill ORDER BY skill_name;")
    return [dict(r) for r in rows]


@router.get("/{skill_id}")
async def get_skill(skill_id: int, conn: Any = Depends(get_connection)):
    row = await conn.fetchrow(
        "SELECT skill_id, skill_name FROM skill WHERE skill_id = $1;", skill_id
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return dict(row)
