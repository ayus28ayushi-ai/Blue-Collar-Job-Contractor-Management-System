from pydantic import BaseModel, Field
from typing import Literal

# Registration request model
class UserRegister(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8)
    role: Literal["worker", "contractor"]


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1)
    role: Literal["worker", "contractor"] = "worker"
