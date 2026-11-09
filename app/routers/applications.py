
from fastapi import APIRouter, Depends, HTTPException
import asyncpg

from app.database.db import get_connection, as_dict, as_dicts
from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ALLOWED
)
from app.security import require_role, get_current_user

router = APIRouter(tags=["Applications"])


# Get the worker profile linked to the logged-in account
async def get_worker_id(conn, user_id):
    worker_id = await conn.fetchval(
        "SELECT worker_id FROM worker WHERE user_id = $1",
        user_id
    )

    if worker_id is None:
        raise HTTPException(404, "Worker profile not found")

    return worker_id


# Get the contractor profile linked to the logged-in account
async def get_contractor_id(conn, user_id):
    contractor_id = await conn.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        user_id
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    return contractor_id


# Worker applies for a job
@router.post("/applications", status_code=201)
async def create_application(
    a: ApplicationCreate,
    conn=Depends(get_connection),
    current_user=Depends(require_role("worker"))
):
    worker_id = await get_worker_id(conn, current_user["user_id"])

    job_status = await conn.fetchval(
        "SELECT status FROM job WHERE job_id = $1",
        a.job_id
    )

    if job_status is None:
        raise HTTPException(404, "Job not found")

    if job_status != "open":
        raise HTTPException(400, "This job is not open for applications")

    try:
        row = await conn.fetchrow(
            """
            INSERT INTO application (job_id, worker_id)
            VALUES ($1, $2)
            RETURNING *
            """,
            a.job_id, worker_id
        )

        return as_dict(row)

    except asyncpg.UniqueViolationError:
        raise HTTPException(
            409,
            "You have already applied for this job"
        )


# Get a specific application
@router.get("/applications/{application_id}")
async def get_application(
    application_id: int,
    conn=Depends(get_connection),
    current_user=Depends(get_current_user)
):
    row = await conn.fetchrow(
        """
        SELECT a.*, j.title AS job_title,
               w.full_name AS worker_name,
               w.user_id AS worker_user_id,
               c.user_id AS contractor_user_id
        FROM application a
        JOIN job j ON j.job_id = a.job_id
        JOIN worker w ON w.worker_id = a.worker_id
        JOIN contractor c ON c.contractor_id = j.contractor_id
        WHERE a.application_id = $1
        """,
        application_id
    )

    if not row:
        raise HTTPException(404, "Application not found")

    is_admin = current_user["role"] == "admin"
    is_worker_owner = (
        current_user["role"] == "worker"
        and row["worker_user_id"] == current_user["user_id"]
    )
    is_contractor_owner = (
        current_user["role"] == "contractor"
        and row["contractor_user_id"] == current_user["user_id"]
    )

    if not (is_admin or is_worker_owner or is_contractor_owner):
        raise HTTPException(403, "You cannot access this application")

    result = dict(row)
    result.pop("worker_user_id")
    result.pop("contractor_user_id")

    return result


# Contractor views applications for their own job
@router.get("/jobs/{job_id}/applications")
async def applications_for_job(
    job_id: int,
    status: str | None = None,
    conn=Depends(get_connection),
    current_user=Depends(require_role("contractor", "admin"))
):
    params = [job_id]
    where = ["a.job_id = $1"]

    if current_user["role"] == "contractor":
        contractor_id = await get_contractor_id(
            conn, current_user["user_id"]
        )
        params.append(contractor_id)
        where.append(f"j.contractor_id = ${len(params)}")

    if status:
        params.append(status)
        where.append(f"a.status = ${len(params)}")

    rows = await conn.fetch(
        f"""
        SELECT a.application_id, a.status, a.applied_at,
               w.worker_id, w.full_name, w.phone,
               w.expected_daily_wage
        FROM application a
        JOIN worker w ON w.worker_id = a.worker_id
        JOIN job j ON j.job_id = a.job_id
        WHERE {' AND '.join(where)}
        ORDER BY a.applied_at, a.application_id
        """,
        *params
    )

    return as_dicts(rows)


# Worker views their own applications
@router.get("/workers/{worker_id}/applications")
async def applications_by_worker(
    worker_id: int,
    conn=Depends(get_connection),
    current_user=Depends(get_current_user)
):
    if current_user["role"] == "worker":
        own_worker_id = await get_worker_id(
            conn, current_user["user_id"]
        )

        if worker_id != own_worker_id:
            raise HTTPException(403, "You can only view your own applications")

    elif current_user["role"] != "admin":
        raise HTTPException(403, "You do not have permission")

    rows = await conn.fetch(
        """
        SELECT a.application_id, a.status, a.applied_at,
               j.job_id, j.title, c.company_name,
               j.pay_amount, j.pay_type, j.status AS job_status
        FROM application a
        JOIN job j ON j.job_id = a.job_id
        JOIN contractor c ON c.contractor_id = j.contractor_id
        WHERE a.worker_id = $1
        ORDER BY a.applied_at DESC, a.application_id
        """,
        worker_id
    )

    return as_dicts(rows)


# Worker withdraws their own application; admin can delete any
@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: int,
    conn=Depends(get_connection),
    current_user=Depends(get_current_user)
):
    if current_user["role"] == "worker":
        worker_id = await get_worker_id(
            conn, current_user["user_id"]
        )

        deleted = await conn.fetchval(
            """
            DELETE FROM application
            WHERE application_id = $1
              AND worker_id = $2
              AND status IN ('applied', 'shortlisted')
            RETURNING application_id
            """,
            application_id, worker_id
        )

    elif current_user["role"] == "admin":
        deleted = await conn.fetchval(
            """
            DELETE FROM application
            WHERE application_id = $1
              AND status IN ('applied', 'shortlisted')
            RETURNING application_id
            """,
            application_id
        )

    else:
        raise HTTPException(403, "You cannot delete applications")

    if deleted is None:
        raise HTTPException(
            404,
            "No deletable application found"
        )

    return {"deleted": deleted}


# Contractor updates applications for their own jobs; admin can update all
@router.patch("/applications/{application_id}/status")
async def set_application_status(
    application_id: int,
    body: ApplicationStatusUpdate,
    conn=Depends(get_connection),
    current_user=Depends(get_current_user)
):
    if current_user["role"] == "contractor":
        contractor_id = await get_contractor_id(
            conn, current_user["user_id"]
        )
    elif current_user["role"] == "admin":
        contractor_id = None
    else:
        raise HTTPException(
            403,
            "Only contractors and admins can manage application status"
        )

    async with conn.transaction():
        if contractor_id is None:
            job_id = await conn.fetchval(
                "SELECT job_id FROM application WHERE application_id = $1",
                application_id
            )
        else:
            job_id = await conn.fetchval(
                """
                SELECT a.job_id
                FROM application a
                JOIN job j ON j.job_id = a.job_id
                WHERE a.application_id = $1
                  AND j.contractor_id = $2
                """,
                application_id, contractor_id
            )

        if job_id is None:
            raise HTTPException(
                404,
                "Application not found or does not belong to you"
            )

        job = await conn.fetchrow(
            """
            SELECT status, workers_needed
            FROM job
            WHERE job_id = $1
            FOR UPDATE
            """,
            job_id
        )

        current = await conn.fetchval(
            "SELECT status FROM application WHERE application_id = $1",
            application_id
        )

        if body.status not in ALLOWED[current]:
            raise HTTPException(
                400,
                f"Cannot move from {current} to {body.status}"
            )

        if body.status == "accepted":
            if job["status"] != "open":
                raise HTTPException(
                    400,
                    "Workers can only be accepted while the job is open"
                )

            accepted = await conn.fetchval(
                """
                SELECT COUNT(*)
                FROM application
                WHERE job_id = $1 AND status = 'accepted'
                """,
                job_id
            )

            if accepted >= job["workers_needed"]:
                raise HTTPException(
                    409,
                    "All positions for this job are already filled"
                )

        row = await conn.fetchrow(
            """
            UPDATE application
            SET status = $1
            WHERE application_id = $2
            RETURNING *
            """,
            body.status, application_id
        )

    return as_dict(row)
