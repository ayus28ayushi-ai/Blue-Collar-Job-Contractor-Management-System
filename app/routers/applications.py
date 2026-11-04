from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection, as_dict, as_dicts
from app.schemas.application_schema import ApplicationCreate, ApplicationStatusUpdate, ALLOWED

router = APIRouter(tags=["Applications"])

# endpoint to create application
@router.post("/applications", status_code=201)
async def create_application(a: ApplicationCreate, conn=Depends(get_connection)):
    row = await conn.fetchrow(
        "INSERT INTO application (job_id, worker_id) VALUES ($1, $2) RETURNING *",
        a.job_id, a.worker_id)
    return as_dict(row)

# endpoint to get application by its application id
@router.get("/applications/{application_id}")
async def get_application(application_id: int, conn=Depends(get_connection)):
    row = await conn.fetchrow(
        """SELECT a.*, j.title AS job_title, w.full_name AS worker_name
           FROM application a
           JOIN job j    ON j.job_id = a.job_id
           JOIN worker w ON w.worker_id = a.worker_id
           WHERE a.application_id = $1""", application_id)
    
    if not row:
        raise HTTPException(404, "Application not found")
    return as_dict(row)


# endpoint to get applications filtered by a specific job id
@router.get("/jobs/{job_id}/applications")
async def applications_for_job(job_id: int, status: str | None = None, conn=Depends(get_connection)):
    params, where = [job_id], ["a.job_id = $1"]
    if status:
        params.append(status)
        where.append(f"a.status = ${len(params)}")

    return as_dicts(await conn.fetch(
        f"""SELECT a.application_id, a.status, a.applied_at, w.worker_id, w.full_name,
                   w.phone, w.expected_daily_wage
            FROM application a JOIN worker w ON w.worker_id = a.worker_id
            WHERE {' AND '.join(where)} ORDER BY a.applied_at, a.application_id""", *params))

# endpoint to get applications filtered by a specific worker id
@router.get("/workers/{worker_id}/applications")
async def applications_by_worker(worker_id: int, conn=Depends(get_connection)):
    return as_dicts(await conn.fetch(
        """SELECT a.application_id, a.status, a.applied_at, j.job_id, j.title,
                  c.company_name, j.pay_amount, j.pay_type, j.status AS job_status
           FROM application a
           JOIN job j        ON j.job_id = a.job_id
           JOIN contractor c ON c.contractor_id = j.contractor_id
           WHERE a.worker_id = $1 ORDER BY a.applied_at DESC, a.application_id""", worker_id))


# endpoint to delete application
@router.delete("/applications/{application_id}")
async def delete_application(application_id: int, conn=Depends(get_connection)):
    # applications that are in the status "applied" and "shortlisted" can be deleted
    deleted = await conn.fetchval(
        """DELETE FROM application
           WHERE application_id=$1 AND status IN ('applied','shortlisted')
           RETURNING application_id""", application_id)
    
    if deleted is None:
        raise HTTPException(404, "No deletable application found (only applied/shortlisted)")
    return {"deleted": application_id}


# endpoint to set the application status
@router.patch("/applications/{application_id}/status")
async def set_application_status(application_id: int, body: ApplicationStatusUpdate,
                                 conn=Depends(get_connection)):
    async with conn.transaction():
        job_id = await conn.fetchval("SELECT job_id FROM application WHERE application_id=$1",
                                     application_id)
        if job_id is None:
            raise HTTPException(404, "Application not found")

        # Lock the JOB row. A second request for the same job waits on this line until
        # this transaction ends, so the "how many are accepted" count below can never be
        # out of date. Locking the job first (before touching applications) keeps the lock
        # order the same as the job status change, so the two can never deadlock.
        job = await conn.fetchrow(
            "SELECT status, workers_needed FROM job WHERE job_id=$1 FOR UPDATE", job_id)

        # Read the current status only AFTER the lock, so we never act on stale data.
        current = await conn.fetchval(
            "SELECT status FROM application WHERE application_id=$1", application_id)
        
        if body.status not in ALLOWED[current]:
            raise HTTPException(400, f"Cannot move from {current} to {body.status}")

        if body.status == "accepted":
            if job["status"] != "open":
                raise HTTPException(400, "Workers can only be accepted while the job is open")
            accepted = await conn.fetchval(
                "SELECT COUNT(*) FROM application WHERE job_id=$1 AND status='accepted'", job_id)
            if accepted >= job["workers_needed"]:
                raise HTTPException(409, "All positions for this job are already filled")

        row = await conn.fetchrow(
            "UPDATE application SET status=$1 WHERE application_id=$2 RETURNING *",
            body.status, application_id)
    return as_dict(row)