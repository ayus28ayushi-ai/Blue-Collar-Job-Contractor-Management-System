
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.database.db import get_connection
from app.schemas.rating_schema import RatingCreate
from app.security import require_role

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_rating(
    payload: RatingCreate,
    conn: Any = Depends(get_connection),
    current_user=Depends(require_role("worker"))
):
    # Find the application and verify that it belongs to this worker
    app_data = await conn.fetchrow(
        """
        SELECT a.application_id, a.status, w.user_id,
               j.status AS job_status
        FROM application a
        JOIN worker w ON w.worker_id = a.worker_id
        JOIN job j ON j.job_id = a.job_id
        WHERE a.application_id = $1
        """,
        payload.application_id
    )

    if not app_data:
        raise HTTPException(404, "Application not found")

    if app_data["user_id"] != current_user["user_id"]:
        raise HTTPException(
            403,
            "You can only rate your own completed jobs"
        )

    if app_data["status"] != "completed" or app_data["job_status"] != "completed":
        raise HTTPException(
            400,
            "Ratings can only be submitted for completed jobs"
        )

    try:
        new_rating = await conn.fetchrow(
            """
            INSERT INTO rating (application_id, score, comment, rated_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING rating_id, application_id, score, comment, rated_at
            """,
            payload.application_id,
            payload.score,
            payload.comment
        )

        return dict(new_rating)

    except Exception as e:
        # PostgreSQL unique constraint prevents duplicate ratings
        import asyncpg

        if isinstance(e, asyncpg.UniqueViolationError):
            raise HTTPException(
                409,
                "A rating has already been submitted for this application"
            )
        raise
