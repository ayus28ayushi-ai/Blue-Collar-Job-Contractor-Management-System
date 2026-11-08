from typing import Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
import asyncpg
from app.database import get_db
from app.errors import raise_http_from_db

router = APIRouter(prefix="/workers", tags=["Workers"])


class WorkerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=5, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., min_length=1, max_length=60)
    experience_years: int = Field(0, ge=0)
    expected_daily_wage: float = Field(0, ge=0)
    is_available: bool = True


class WorkerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=5, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=60)
    experience_years: Optional[int] = Field(None, ge=0)
    expected_daily_wage: Optional[float] = Field(None, ge=0)
    is_available: Optional[bool] = None


class WorkerSkillCreate(BaseModel):
    skill_id: int
    years_experience: int = Field(0, ge=0)
    proficiency: str = Field("beginner", pattern="^(beginner|intermediate|expert)$")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_worker(payload: WorkerCreate, conn: Any = Depends(get_db)):
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO worker
                (full_name, phone, email, city, experience_years, expected_daily_wage, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING worker_id, full_name, phone, email, city,
                      experience_years, expected_daily_wage, is_available, created_at;
            """,
            payload.full_name, payload.phone, payload.email, payload.city,
            payload.experience_years, payload.expected_daily_wage, payload.is_available,
        )
        return dict(row)
    except Exception as e:
        raise_http_from_db(e, unique_msg="Phone or email already exists")


@router.get("")
async def list_workers(conn: Any = Depends(get_db)):
    rows = await conn.fetch(
        """
        SELECT worker_id, full_name, phone, email, city,
               experience_years, expected_daily_wage, is_available, created_at
        FROM worker ORDER BY worker_id;
        """
    )
    return [dict(r) for r in rows]


@router.get("/{worker_id}")
async def get_worker(worker_id: int, conn: Any = Depends(get_db)):
    row = await conn.fetchrow(
        """
        SELECT worker_id, full_name, phone, email, city,
               experience_years, expected_daily_wage, is_available, created_at
        FROM worker WHERE worker_id = $1;
        """,
        worker_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return dict(row)


@router.put("/{worker_id}")
async def update_worker(worker_id: int, payload: WorkerUpdate, conn: Any = Depends(get_db)):
    existing = await conn.fetchrow("SELECT worker_id FROM worker WHERE worker_id = $1;", worker_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clauses = []
    values = []
    for i, (col, val) in enumerate(data.items(), start=1):
        set_clauses.append(f"{col} = ${i}")
        values.append(val)
    values.append(worker_id)

    query = f"""
        UPDATE worker SET {', '.join(set_clauses)}
        WHERE worker_id = ${len(values)}
        RETURNING worker_id, full_name, phone, email, city,
                  experience_years, expected_daily_wage, is_available, created_at;
    """
    try:
        row = await conn.fetchrow(query, *values)
        return dict(row)
    except Exception as e:
        raise_http_from_db(e, unique_msg="Phone or email already exists")


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_worker(worker_id: int, conn: Any = Depends(get_db)):
    existing = await conn.fetchrow("SELECT worker_id FROM worker WHERE worker_id = $1;", worker_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    try:
        await conn.execute("DELETE FROM worker WHERE worker_id = $1;", worker_id)
    except Exception as e:
        raise_http_from_db(e)


@router.post("/{worker_id}/skills", status_code=status.HTTP_201_CREATED)
async def add_skill_to_worker(
    worker_id: int, payload: WorkerSkillCreate, conn: Any = Depends(get_db)
):
    worker = await conn.fetchrow("SELECT worker_id FROM worker WHERE worker_id = $1;", worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    skill = await conn.fetchrow("SELECT skill_id FROM skill WHERE skill_id = $1;", payload.skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO worker_skill (worker_id, skill_id, years_experience, proficiency)
            VALUES ($1, $2, $3, $4)
            RETURNING worker_id, skill_id, years_experience, proficiency;
            """,
            worker_id, payload.skill_id, payload.years_experience, payload.proficiency,
        )
        return dict(row)
    except Exception as e:
        raise_http_from_db(e, unique_msg="Worker already has this skill")


@router.get("/{worker_id}/skills")
async def list_worker_skills(worker_id: int, conn: Any = Depends(get_db)):
    worker = await conn.fetchrow("SELECT worker_id FROM worker WHERE worker_id = $1;", worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    rows = await conn.fetch(
        """
        SELECT ws.skill_id, s.skill_name, ws.years_experience, ws.proficiency
        FROM worker_skill ws
        JOIN skill s ON s.skill_id = ws.skill_id
        WHERE ws.worker_id = $1
        ORDER BY s.skill_name;
        """,
        worker_id,
    )
    return [dict(r) for r in rows]
