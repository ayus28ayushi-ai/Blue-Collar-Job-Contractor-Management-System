from pydantic import BaseModel, Field, model_validator
from datetime import date
from typing import List, Literal, Optional

class JobSkillIn(BaseModel):
    skill_id: int
    min_years_required: int = Field(default=0, ge=0)


class JobIn(BaseModel):
    contractor_id: int
    category_id: int
    title: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    location: str = Field(min_length=1, max_length=100)
    pay_amount: float = Field(gt=0)
    pay_type: Literal["daily", "hourly", "fixed"]
    workers_needed: int = Field(default=1, gt=0)
    start_date: date
    end_date: date
    skills: List[JobSkillIn] = []

    @model_validator(mode="after")
    def check_dates_and_skills(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        ids = [s.skill_id for s in self.skills]
        if len(ids) != len(set(ids)):
            raise ValueError("the same skill is listed more than once")
        return self


class StatusIn(BaseModel):
    status: Literal["open", "in_progress", "completed", "cancelled"]