
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.database.db import get_connection
from app.security import require_role


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# Q3: Applications per job
@router.get("/applications-per-job")
async def applications_per_job(
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    rows = await conn.fetch("""
        SELECT
            j.job_id,
            j.title,
            j.status,
            COUNT(a.application_id) AS total_applications
        FROM job j
        LEFT JOIN application a ON a.job_id = j.job_id
        GROUP BY j.job_id, j.title, j.status
        ORDER BY total_applications DESC, j.job_id
    """)

    return [dict(row) for row in rows]


# Q4: Top contractors by jobs posted
@router.get("/top-contractors")
async def top_contractors(
    limit: int = Query(default=3, ge=1, le=20),
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    rows = await conn.fetch("""
        SELECT
            c.contractor_id,
            c.company_name,
            COUNT(j.job_id) AS jobs_posted
        FROM contractor c
        JOIN job j ON j.contractor_id = c.contractor_id
        GROUP BY c.contractor_id, c.company_name
        ORDER BY jobs_posted DESC, c.company_name
        LIMIT $1
    """, limit)

    return [dict(row) for row in rows]


# Q6: Average pay by job category
@router.get("/average-pay-by-category")
async def average_pay_by_category(
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    rows = await conn.fetch("""
        SELECT
            jc.category_name,
            j.pay_type,
            COUNT(*) AS jobs,
            ROUND(AVG(j.pay_amount), 2) AS avg_pay
        FROM job j
        JOIN job_category jc ON jc.category_id = j.category_id
        GROUP BY jc.category_name, j.pay_type
        ORDER BY jc.category_name, j.pay_type
    """)

    return [dict(row) for row in rows]


# Q10: Most requested skills
@router.get("/most-requested-skills")
async def most_requested_skills(
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    rows = await conn.fetch("""
        SELECT
            s.skill_id,
            s.skill_name,
            COUNT(js.job_id) AS jobs_requiring
        FROM skill s
        LEFT JOIN job_skill js ON js.skill_id = s.skill_id
        GROUP BY s.skill_id, s.skill_name
        ORDER BY jobs_requiring DESC, s.skill_name
    """)

    return [dict(row) for row in rows]


# Q12: Worker rating summary
@router.get("/worker-rating-summary")
async def worker_rating_summary(
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    rows = await conn.fetch("""
        SELECT
            w.worker_id,
            w.full_name,
            COUNT(r.rating_id) AS total_ratings,
            ROUND(AVG(r.score), 2) AS avg_score,
            MIN(r.score) AS min_score,
            MAX(r.score) AS max_score
        FROM worker w
        JOIN application a ON a.worker_id = w.worker_id
        JOIN rating r ON r.application_id = a.application_id
        GROUP BY w.worker_id, w.full_name
        ORDER BY avg_score DESC, total_ratings DESC
    """)

    return [dict(row) for row in rows]
