from pydantic import BaseModel
from typing import Literal

# Legal application status moves 
ALLOWED = {"applied": {"shortlisted", "accepted", "rejected", "withdrawn"},
           "shortlisted": {"accepted", "rejected", "withdrawn"},
           "accepted": {"withdrawn"},
           "rejected": set(), "withdrawn": set(), "completed": set()}

# request model to create application
class ApplicationCreate(BaseModel):
    job_id: int
    worker_id: int

# request model for application status update
class ApplicationStatusUpdate(BaseModel):
    status: Literal["shortlisted", "accepted", "rejected", "withdrawn"]