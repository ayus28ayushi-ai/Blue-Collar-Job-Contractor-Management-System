from pydantic import BaseModel, Field
from typing import Optional

class RatingCreate(BaseModel):
    application_id: int
    score: int = Field(..., ge=1, le=5, description="Score must be between 1 and 5")
    comment: Optional[str] = None