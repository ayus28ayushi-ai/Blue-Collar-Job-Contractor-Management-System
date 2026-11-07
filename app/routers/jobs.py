from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_db

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/{job_id}/matching-workers")
async def matching_workers(job_id: int, conn: Any = Depends(get_db)):
    """Workers who have ALL skills required by the job (Q7)."""
    job = await conn.fetchrow("SELECT job_id FROM job WHERE job_id = $1;", job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

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
