from pydantic import BaseModel, Field
from datetime import date
from typing import Literal

# Pydantic request model for job creation
class JobCreate(BaseModel):
    category_id: int
    title: str = Field(min_length=3, max_length=120)
    description: str | None = None
    location: str
    pay_amount: float = Field(gt=0)
    pay_type: Literal["daily", "hourly", "fixed"]
    workers_needed: int = Field(1, gt=0)
    start_date: date
    end_date: date


# Pydantic request model for job updation
class JobUpdate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str | None = None
    location: str
    pay_amount: float = Field(gt=0)
    workers_needed: int = Field(1, gt=0)
    start_date: date
    end_date: date

class JobStatusUpdate(BaseModel):
    status: Literal["in_progress", "completed"]