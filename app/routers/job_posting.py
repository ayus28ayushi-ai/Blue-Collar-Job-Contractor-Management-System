from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from app.database.db import get_connection, as_dict, as_dicts
from app.schemas.job_posting_schema import JobIn, JobSkillIn, StatusIn
from app.security import require_role

router = APIRouter(prefix="/jobs", tags=["Job Posting and Status"])


# post a job together with the skills it needs.
# either the job and all its job_skill rows get saved, or nothing does.

@router.post("/with-skills", status_code=201)
async def post_job_with_skills(
    data: JobIn,
    con=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await con.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    try:
        async with con.transaction():
            job = await con.fetchrow(
                """INSERT INTO job (
                    contractor_id, category_id, title, description,
                    location, pay_amount, pay_type, workers_needed,
                    start_date, end_date
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *""",
                contractor_id, data.category_id, data.title,
                data.description, data.location, data.pay_amount,
                data.pay_type, data.workers_needed,
                data.start_date, data.end_date,
            )

            for s in data.skills:
                await con.execute(
                    """INSERT INTO job_skill
                    (job_id, skill_id, min_years_required)
                    VALUES ($1, $2, $3)""",
                    job["job_id"], s.skill_id, s.min_years_required,
                )

    except asyncpg.ForeignKeyViolationError:
        raise HTTPException(
            400,
            "Category or one of the skills does not exist"
        )
    except asyncpg.CheckViolationError:
        raise HTTPException(422, "Invalid value in job details")

    skills = await con.fetch(
        """SELECT s.skill_id, s.skill_name, js.min_years_required
           FROM job_skill js
           JOIN skill s ON s.skill_id = js.skill_id
           WHERE js.job_id = $1
           ORDER BY s.skill_id""",
        job["job_id"],
    )

    result = as_dict(job)
    result["skills"] = as_dicts(skills)
    return result



# which status a job is allowed to move to from its current one
ALLOWED = {
    "open": ["in_progress", "cancelled"],
    "in_progress": ["completed", "cancelled"],
}



@router.put("/{job_id}/status")
async def change_job_status(
    job_id: int,
    data: StatusIn,
    con=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    contractor_id = await con.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if contractor_id is None:
        raise HTTPException(404, "Contractor profile not found")

    ALLOWED = {
        "open": ["in_progress", "cancelled"],
        "in_progress": ["completed", "cancelled"],
    }

    async with con.transaction():
        job = await con.fetchrow(
            """
            SELECT job_id, status
            FROM job
            WHERE job_id = $1 AND contractor_id = $2
            FOR UPDATE
            """,
            job_id, contractor_id
        )

        if job is None:
            raise HTTPException(404, "Job not found or not owned by you")

        current = job["status"]
        new = data.status

        if new not in ALLOWED.get(current, []):
            raise HTTPException(
                400,
                f"A job that is '{current}' cannot be changed to '{new}'"
            )

        if new == "completed":
            accepted = await con.fetchval(
                """
                SELECT COUNT(*)
                FROM application
                WHERE job_id = $1 AND status = 'accepted'
                """,
                job_id
            )

            if accepted == 0:
                raise HTTPException(
                    400,
                    "Cannot complete a job with no accepted applications"
                )

            await con.execute(
                """
                UPDATE application
                SET status = 'completed'
                WHERE job_id = $1 AND status = 'accepted'
                """,
                job_id
            )

        updated = await con.fetchrow(
            """
            UPDATE job
            SET status = $1
            WHERE job_id = $2
            RETURNING *
            """,
            new, job_id
        )

    return as_dict(updated)
