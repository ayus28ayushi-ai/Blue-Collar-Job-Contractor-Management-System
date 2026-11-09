from pydantic import BaseModel, Field

class ContractorIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=100)
    contact_person: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=15)
    email: str = Field(min_length=3, max_length=100)
    city: str = Field(min_length=1, max_length=60)