from pydantic import BaseModel, Field
from typing import Optional

class WorkerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=5, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., min_length=1, max_length=60)
    experience_years: int = Field(0, ge=0)
    expected_daily_wage: float = Field(0, ge=0)
    is_available: bool = True


class WorkerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=5, max_length=15)
    city: Optional[str] = Field(None, min_length=1, max_length=60)
    experience_years: Optional[int] = Field(None, ge=0)
    expected_daily_wage: Optional[float] = Field(None, ge=0)
    is_available: Optional[bool] = None


class WorkerSkillCreate(BaseModel):
    skill_id: int
    years_experience: int = Field(0, ge=0)
    proficiency: str = Field("beginner", pattern="^(beginner|intermediate|expert)$")

