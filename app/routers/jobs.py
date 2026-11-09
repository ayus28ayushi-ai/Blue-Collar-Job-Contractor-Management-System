from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection, as_dicts, as_dict
from app.schemas.job_schema import JobCreate, JobUpdate, JobStatusUpdate
from typing import Any
from app.security import require_role
from app.errors import raise_http_from_db

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# create jobs

@router.post("", status_code=201)
async def create_job(
    j: JobCreate,
    conn=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await conn.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(
            status_code=404,
            detail="Contractor profile not found"
        )

    row = await conn.fetchrow(
        """
        INSERT INTO job (
            contractor_id, category_id, title, description, location,
            pay_amount, pay_type, workers_needed, start_date, end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        """,
        contractor_id,
        j.category_id,
        j.title,
        j.description,
        j.location,
        j.pay_amount,
        j.pay_type,
        j.workers_needed,
        j.start_date,
        j.end_date
    )

    return as_dict(row)

@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: int,
    body: JobStatusUpdate,
    conn=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await conn.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    async with conn.transaction():

        job = await conn.fetchrow(
            """
            SELECT status
            FROM job
            WHERE job_id = $1 AND contractor_id = $2
            FOR UPDATE
            """,
            job_id, contractor_id
        )

        if not job:
            raise HTTPException(404, "Job not found or not owned by you")

        accepted_count = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM application
            WHERE job_id = $1 AND status = 'accepted'
            """,
            job_id
        )

        if accepted_count == 0:
            raise HTTPException(
                400,
                "At least one worker must be accepted before starting or completing the job"
            )

        if body.status == "in_progress":
            if job["status"] != "open":
                raise HTTPException(
                    400,
                    "Only open jobs can be moved to in_progress"
                )

        elif body.status == "completed":
            if job["status"] != "in_progress":
                raise HTTPException(
                    400,
                    "Only in-progress jobs can be completed"
                )

        updated_job = await conn.fetchrow(
            """
            UPDATE job
            SET status = $1
            WHERE job_id = $2
            RETURNING job_id, status
            """,
            body.status, job_id
        )

        completed_applications = 0

        if body.status == "completed":
            completed_applications = await conn.fetchval(
                """
                WITH updated AS (
                    UPDATE application
                    SET status = 'completed'
                    WHERE job_id = $1 AND status = 'accepted'
                    RETURNING application_id
                )
                SELECT COUNT(*) FROM updated
                """,
                job_id
            )

    return {
        "message": f"Job marked as {body.status}",
        "job": dict(updated_job),
        "completed_applications": completed_applications
    }


# router to search jobs
@router.get("/search")
async def search_jobs(skill: str | None = None, location: str | None = None,
                      category: str | None = None, min_pay: float | None = None,
                      max_pay: float | None = None, status: str = "open",
                      conn=Depends(get_connection)):
    params = [status]
    where = ["j.status = $1"]


    def add(condition: str, value):
        params.append(value)
        where.append(condition.replace("?", f"${len(params)}"))

    if skill:
        add("""EXISTS (SELECT 1 FROM job_skill js JOIN skill s ON s.skill_id = js.skill_id
                       WHERE js.job_id = j.job_id AND s.skill_name ILIKE ?)""", skill)
    if location:
        add("j.location ILIKE ?", f"%{location}%")
    if category:
        add("cat.category_name ILIKE ?", category)
    if min_pay is not None:
        add("j.pay_amount >= ?", min_pay)
    if max_pay is not None:
        add("j.pay_amount <= ?", max_pay)

    sql = f"""
        SELECT j.job_id, j.title, c.company_name, cat.category_name, j.location,
               j.pay_amount, j.pay_type, j.workers_needed, j.start_date,
               (SELECT STRING_AGG(s.skill_name, ', ' ORDER BY s.skill_name)
                  FROM job_skill js JOIN skill s ON s.skill_id = js.skill_id
                 WHERE js.job_id = j.job_id) AS required_skills
        FROM job j
        JOIN contractor c     ON c.contractor_id = j.contractor_id
        JOIN job_category cat ON cat.category_id = j.category_id
        WHERE {' AND '.join(where)}
        ORDER BY j.pay_amount DESC, j.job_id"""
    return as_dicts(await conn.fetch(sql, *params))


# endpoint to get teh job by its id
@router.get("/{job_id}")
async def get_job(job_id: int, conn=Depends(get_connection)):
    job = as_dict(await conn.fetchrow(
        """SELECT j.*, c.company_name, cat.category_name
           FROM job j
           JOIN contractor c     ON c.contractor_id = j.contractor_id
           JOIN job_category cat ON cat.category_id = j.category_id
           WHERE j.job_id = $1""", job_id))
    
    if not job:
        raise HTTPException(404, "Job not found")
    
    job["skills"] = as_dicts(await conn.fetch(
        """SELECT s.skill_id, s.skill_name, js.min_years_required
           FROM job_skill js JOIN skill s ON s.skill_id = js.skill_id
           WHERE js.job_id = $1 ORDER BY s.skill_name""", job_id))
    return job


# endpoint to update the job

@router.put("/{job_id}")
async def update_job(
    job_id: int,
    j: JobUpdate,
    conn=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await conn.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    row = await conn.fetchrow(
        """
        UPDATE job
        SET title=$1,
            description=$2,
            location=$3,
            pay_amount=$4,
            workers_needed=$5,
            start_date=$6,
            end_date=$7
        WHERE job_id=$8
          AND contractor_id=$9
          AND status='open'
        RETURNING *
        """,
        j.title, j.description, j.location, j.pay_amount,
        j.workers_needed, j.start_date, j.end_date,
        job_id, contractor_id
    )

    if not row:
        raise HTTPException(
            404,
            "Job not found, not owned by you, or not open"
        )

    return as_dict(row)


# endpoint to delete a job

# Only the contractor who owns the job can delete it
@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    conn=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await conn.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    # Check whether the job exists and belongs to this contractor
    job = await conn.fetchrow(
        """
        SELECT job_id FROM job
        WHERE job_id = $1 AND contractor_id = $2
        """,
        job_id, contractor_id
    )

    if not job:
        raise HTTPException(
            404,
            "Job not found or you do not own this job"
        )

    # Prevent deletion if applications already exist
    application = await conn.fetchrow(
        """
        SELECT application_id
        FROM application
        WHERE job_id = $1
        LIMIT 1
        """,
        job_id
    )

    if application:
        raise HTTPException(
            409,
            "Cannot delete this job because it has existing applications."
        )

    try:
        await conn.execute(
            "DELETE FROM job WHERE job_id = $1",
            job_id
        )
    except Exception as e:
        raise_http_from_db(e)

    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/matching-workers")
async def matching_workers(job_id: int, conn: Any = Depends(get_connection)):
    """Workers who have ALL skills required by the job (Q7)."""
    job = await conn.fetchrow("SELECT job_id FROM job WHERE job_id = $1;", job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    rows = await conn.fetch(
        """
        SELECT w.worker_id, w.full_name, w.city
        FROM worker w
        JOIN worker_skill ws ON ws.worker_id = w.worker_id
        WHERE ws.skill_id IN (SELECT skill_id FROM job_skill WHERE job_id = $1)
        GROUP BY w.worker_id, w.full_name, w.city
        HAVING COUNT(DISTINCT ws.skill_id) = (
            SELECT COUNT(*) FROM job_skill WHERE job_id = $1
        )
        ORDER BY w.worker_id;
        """,
        job_id,
    )
    return [dict(r) for r in rows]
