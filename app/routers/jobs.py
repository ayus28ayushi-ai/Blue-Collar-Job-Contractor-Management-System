from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection, as_dicts, as_dict
from app.schemas.job_schema import JobCreate, JobUpdate

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# create jobs
@router.post("", status_code=201)
async def create_job(j: JobCreate, conn=Depends(get_connection)):
    """Basic create (no skills). B replaces this with the transaction version that also
    inserts the job_skill rows; both use the same URL, so keep only one of them."""
    row = await conn.fetchrow(
        """INSERT INTO job (contractor_id, category_id, title, description, location,
                            pay_amount, pay_type, workers_needed, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *""",
        j.contractor_id, j.category_id, j.title, j.description, j.location,
        j.pay_amount, j.pay_type, j.workers_needed, j.start_date, j.end_date)
    return as_dict(row)

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
<<<<<<< HEAD

=======
                          
# end point to get matching workers for a job
@router.get("/{job_id}/matching-workers")
async def matching_workers(job_id: int, conn=Depends(get_connection)):
    """Workers who have ALL skills required by the job (Q7)."""
    job = await conn.fetchrow(
        "SELECT job_id FROM job WHERE job_id = $1;", job_id
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

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
    return as_dicts(rows)
>>>>>>> origin/sri

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
async def update_job(job_id: int, j: JobUpdate, conn=Depends(get_connection)):
    row = await conn.fetchrow(
        """UPDATE job SET title=$1, description=$2, location=$3, pay_amount=$4,
                          workers_needed=$5, start_date=$6, end_date=$7
           WHERE job_id=$8 AND status = 'open' RETURNING *""",
        j.title, j.description, j.location, j.pay_amount, j.workers_needed,
        j.start_date, j.end_date, job_id)
    
    if not row:
        raise HTTPException(404, "Open job not found (only open jobs can be edited)")
    return as_dict(row)

# endpoint to delete a job
@router.delete("/{job_id}")
async def delete_job(job_id: int, conn=Depends(get_connection)):
    deleted = await conn.fetchval("DELETE FROM job WHERE job_id=$1 RETURNING job_id", job_id)
    if deleted is None:
        raise HTTPException(404, "Job not found")
<<<<<<< HEAD
    return {"deleted": job_id}      # 400 if applications exist (the database blocks it: RESTRICT)
=======
    return {"deleted": job_id}      # 400 if applications exist (the database blocks it: RESTRICT)
>>>>>>> origin/sri
