from pydantic import BaseModel, Field

class PaymentCreate(BaseModel):
    application_id: int
    amount: float = Field(..., gt=0, description="Payment amount must be greater than 0")
    method: str = Field(..., pattern="^(cash|upi|bank_transfer)$", description="Must be cash, upi, or bank_transfer")