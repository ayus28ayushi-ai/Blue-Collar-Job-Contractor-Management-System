from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
import asyncpg
from app.database.db import get_connection

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    application_id: int
    amount: float = Field(..., gt=0, description="Payment amount must be greater than 0")
    method: str = Field(..., pattern="^(cash|upi|bank_transfer)$", description="Must be cash, upi, or bank_transfer")

@router.post("", status_code=status.HTTP_201_CREATED, response_model=None)
async def process_payment(
    payload: PaymentCreate,
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
            detail="Payments can only be processed for completed jobs"
        )

    # 2. Insert payment record
    new_payment = await conn.fetchrow(
        """
        INSERT INTO payment (application_id, amount, paid_on, method, status)
        VALUES ($1, $2, CURRENT_DATE, $3, 'paid')
        RETURNING payment_id, application_id, amount, paid_on, method, status;
        """,
        payload.application_id,
        payload.amount,
        payload.method
    )
    return dict(new_payment)