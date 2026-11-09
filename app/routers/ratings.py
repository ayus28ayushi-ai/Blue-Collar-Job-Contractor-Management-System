from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
import asyncpg
from app.database.db import get_connection
from app.schemas.rating_schema import RatingCreate

router = APIRouter(prefix="/ratings", tags=["Ratings"])



@router.post("", status_code=status.HTTP_201_CREATED, response_model=None)
async def create_rating(
    payload: RatingCreate,
    conn: Any = Depends(get_connection)
):
    # 1. Check if application exists and verify its job is completed
    app_data = await conn.fetchrow(
        """
        SELECT a.application_id, j.status 
        FROM application a
        JOIN job j ON a.job_id = j.job_id
        WHERE a.application_id = $1;
        """, 
        payload.application_id
    )

    if not app_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Application not found"
        )

    if app_data["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ratings can only be submitted for completed jobs"
        )

    # 2. Insert rating or handle unique application_id constraint
    try:
        new_rating = await conn.fetchrow(
            """
            INSERT INTO rating (application_id, score, comment, rated_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING rating_id, application_id, score, comment, rated_at;
            """,
            payload.application_id,
            payload.score,
            payload.comment
        )
        return dict(new_rating)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rating has already been submitted for this application"
        )