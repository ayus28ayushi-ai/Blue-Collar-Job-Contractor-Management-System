
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.worker_schema import (
    WorkerCreate,
    WorkerSkillCreate,
    WorkerUpdate
)
from app.database.db import get_connection
from app.errors import raise_http_from_db
from app.security import require_role, get_current_user

router = APIRouter(prefix="/workers", tags=["Workers"])


# Get the worker profile linked to a user account
async def get_own_worker_id(conn, user_id):
    worker_id = await conn.fetchval(
        "SELECT worker_id FROM worker WHERE user_id = $1",
        user_id
    )

    if worker_id is None:
        raise HTTPException(404, "Worker profile not found")

    return worker_id


# Create worker profile
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_worker(
    payload: WorkerCreate,
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("worker"))
):
    existing = await conn.fetchval(
        "SELECT worker_id FROM worker WHERE user_id = $1",
        current_user["user_id"]
    )

    if existing:
        raise HTTPException(409, "Your worker profile already exists")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO worker
                (user_id, full_name, phone, email, city,
                 experience_years, expected_daily_wage, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING worker_id, full_name, phone, email, city,
                      experience_years, expected_daily_wage,
                      is_available, created_at
            """,
            current_user["user_id"],
            payload.full_name,
            payload.phone,
            current_user["email"],
            payload.city,
            payload.experience_years,
            payload.expected_daily_wage,
            payload.is_available
        )

        return dict(row)

    except Exception as e:
        raise_http_from_db(e, unique_msg="Phone or email already exists")


# Contractors and admins can view the worker list
@router.get("")
async def list_workers(
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("contractor", "admin"))
):
    rows = await conn.fetch(
        """
        SELECT worker_id, full_name, phone, email, city,
               experience_years, expected_daily_wage,
               is_available, created_at
        FROM worker
        ORDER BY worker_id
        """
    )

    return [dict(row) for row in rows]


# Get a worker profile
@router.get("/{worker_id}")
async def get_worker(
    worker_id: int,
    conn: Any = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    row = await conn.fetchrow(
        """
        SELECT worker_id, user_id, full_name, phone, email, city,
               experience_years, expected_daily_wage,
               is_available, created_at
        FROM worker
        WHERE worker_id = $1
        """,
        worker_id
    )

    if not row:
        raise HTTPException(404, "Worker not found")

    # Workers can view only their own profile
    if current_user["role"] == "worker":
        if row["user_id"] != current_user["user_id"]:
            raise HTTPException(403, "You can only view your own profile")

    elif current_user["role"] not in ("contractor", "admin"):
        raise HTTPException(403, "You do not have permission")

    result = dict(row)
    result.pop("user_id")

    return result


# Update own worker profile; admin can update any worker
@router.put("/{worker_id}")
async def update_worker(
    worker_id: int,
    payload: WorkerUpdate,
    conn: Any = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    existing = await conn.fetchrow(
        "SELECT worker_id, user_id FROM worker WHERE worker_id = $1",
        worker_id
    )

    if not existing:
        raise HTTPException(404, "Worker not found")

    if current_user["role"] == "worker":
        if existing["user_id"] != current_user["user_id"]:
            raise HTTPException(403, "You can only update your own profile")

    elif current_user["role"] != "admin":
        raise HTTPException(403, "You do not have permission to update this profile")

    data = payload.model_dump(exclude_unset=True)

    # Email is managed by the login account
    if "email" in data:
        raise HTTPException(
            400,
            "Email cannot be changed through the worker profile endpoint"
        )

    if not data:
        raise HTTPException(400, "No fields to update")

    set_clauses = []
    values = []

    for i, (column, value) in enumerate(data.items(), start=1):
        set_clauses.append(f"{column} = ${i}")
        values.append(value)

    values.append(worker_id)

    query = f"""
        UPDATE worker
        SET {', '.join(set_clauses)}
        WHERE worker_id = ${len(values)}
        RETURNING worker_id, full_name, phone, email, city,
                  experience_years, expected_daily_wage,
                  is_available, created_at
    """

    try:
        row = await conn.fetchrow(query, *values)
        return dict(row)

    except Exception as e:
        raise_http_from_db(e, unique_msg="Phone number already exists")


# Only admins can delete worker profiles

# Only admins can delete worker profiles
@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_worker(
    worker_id: int,
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    # First, check whether the worker exists
    worker = await conn.fetchrow(
        "SELECT worker_id FROM worker WHERE worker_id = $1",
        worker_id
    )

    if not worker:
        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    # Check whether the worker has existing applications
    application = await conn.fetchrow(
        "SELECT application_id FROM application WHERE worker_id = $1 LIMIT 1",
        worker_id
    )

    if application:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this worker because they have existing applications."
        )

    # Delete the worker if no applications exist
    await conn.execute(
        "DELETE FROM worker WHERE worker_id = $1",
        worker_id
    )

    return None



# Add a skill to own profile; admin can manage any worker
@router.post("/{worker_id}/skills", status_code=status.HTTP_201_CREATED)
async def add_skill_to_worker(
    worker_id: int,
    payload: WorkerSkillCreate,
    conn: Any = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    worker = await conn.fetchrow(
        "SELECT worker_id, user_id FROM worker WHERE worker_id = $1",
        worker_id
    )

    if not worker:
        raise HTTPException(404, "Worker not found")

    if current_user["role"] == "worker":
        if worker["user_id"] != current_user["user_id"]:
            raise HTTPException(403, "You can only manage your own skills")

    elif current_user["role"] != "admin":
        raise HTTPException(403, "You do not have permission to add skills")

    skill = await conn.fetchval(
        "SELECT skill_id FROM skill WHERE skill_id = $1",
        payload.skill_id
    )

    if not skill:
        raise HTTPException(404, "Skill not found")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO worker_skill
                (worker_id, skill_id, years_experience, proficiency)
            VALUES ($1, $2, $3, $4)
            RETURNING worker_id, skill_id, years_experience, proficiency
            """,
            worker_id,
            payload.skill_id,
            payload.years_experience,
            payload.proficiency
        )

        return dict(row)

    except Exception as e:
        raise_http_from_db(e, unique_msg="Worker already has this skill")


# Authenticated users can view a worker's skills
@router.get("/{worker_id}/skills")
async def list_worker_skills(
    worker_id: int,
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("worker", "contractor", "admin"))
):
    worker = await conn.fetchval(
        "SELECT worker_id FROM worker WHERE worker_id = $1",
        worker_id
    )

    if not worker:
        raise HTTPException(404, "Worker not found")

    rows = await conn.fetch(
        """
        SELECT ws.skill_id, s.skill_name,
               ws.years_experience, ws.proficiency
        FROM worker_skill ws
        JOIN skill s ON s.skill_id = ws.skill_id
        WHERE ws.worker_id = $1
        ORDER BY s.skill_name
        """,
        worker_id
    )

    return [dict(row) for row in rows]
