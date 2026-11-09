
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.database.db import get_connection
from app.schemas.payment_schema import PaymentCreate
from app.security import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def process_payment(
    payload: PaymentCreate,
    conn: Any = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    # Only contractors and admins can process payments
    if current_user["role"] not in ("contractor", "admin"):
        raise HTTPException(
            403,
            "Only contractors and admins can process payments"
        )

    # Find the application and its job owner
    app_data = await conn.fetchrow(
        """
        SELECT a.application_id, a.status AS application_status,
               j.status AS job_status,
               j.contractor_id,
               c.user_id AS contractor_user_id
        FROM application a
        JOIN job j ON j.job_id = a.job_id
        JOIN contractor c ON c.contractor_id = j.contractor_id
        WHERE a.application_id = $1
        """,
        payload.application_id
    )

    if not app_data:
        raise HTTPException(404, "Application not found")

    # Contractors can pay only for their own jobs
    if (
        current_user["role"] == "contractor"
        and app_data["contractor_user_id"] != current_user["user_id"]
    ):
        raise HTTPException(
            403,
            "You can only process payments for your own jobs"
        )

    if (
        app_data["application_status"] != "completed"
        or app_data["job_status"] != "completed"
    ):
        raise HTTPException(
            400,
            "Payments can only be processed for completed jobs"
        )

    # Prevent duplicate payments
    existing_payment = await conn.fetchrow(
        """
        SELECT payment_id
        FROM payment
        WHERE application_id = $1
        """,
        payload.application_id
    )

    if existing_payment:
        raise HTTPException(
            409,
            "Payment has already been processed for this application"
        )

    new_payment = await conn.fetchrow(
        """
        INSERT INTO payment
            (application_id, amount, paid_on, method, status)
        VALUES ($1, $2, CURRENT_DATE, $3, 'paid')
        RETURNING payment_id, application_id, amount,
                  paid_on, method, status
        """,
        payload.application_id,
        payload.amount,
        payload.method
    )

    return dict(new_payment)
