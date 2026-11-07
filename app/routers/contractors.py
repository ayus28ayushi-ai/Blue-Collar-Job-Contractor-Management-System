import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database.db import get_connection, as_dict, as_dicts
from app.database.errors import raise_http_error

router = APIRouter(prefix="/contractors", tags=["Contractors"])


class ContractorIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=100)
    contact_person: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=15)
    email: str = Field(min_length=3, max_length=100)
    city: str = Field(min_length=1, max_length=60)


@router.post("/", status_code=201)
async def create_contractor(data: ContractorIn, con=Depends(get_connection)):
    try:
        row = await con.fetchrow(
            """INSERT INTO contractor (company_name, contact_person, phone, email, city)
               VALUES ($1, $2, $3, $4, $5) RETURNING *""",
            data.company_name, data.contact_person, data.phone, data.email, data.city,
        )
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Contractor with this phone or email")
    return as_dict(row)


@router.get("/")
async def list_contractors(con=Depends(get_connection)):
    rows = await con.fetch("SELECT * FROM contractor ORDER BY contractor_id")
    return as_dicts(rows)


@router.get("/{contractor_id}")
async def get_contractor(contractor_id: int, con=Depends(get_connection)):
    row = await con.fetchrow("SELECT * FROM contractor WHERE contractor_id = $1", contractor_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return as_dict(row)


@router.put("/{contractor_id}")
async def update_contractor(contractor_id: int, data: ContractorIn, con=Depends(get_connection)):
    try:
        row = await con.fetchrow(
            """UPDATE contractor
               SET company_name = $1, contact_person = $2, phone = $3, email = $4, city = $5
               WHERE contractor_id = $6 RETURNING *""",
            data.company_name, data.contact_person, data.phone, data.email, data.city,
            contractor_id,
        )
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Contractor with this phone or email")
    if row is None:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return as_dict(row)


@router.delete("/{contractor_id}", status_code=204)
async def delete_contractor(contractor_id: int, con=Depends(get_connection)):
    try:
        result = await con.execute("DELETE FROM contractor WHERE contractor_id = $1", contractor_id)
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Contractor")
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Contractor not found")


# all jobs posted by one contractor
@router.get("/{contractor_id}/jobs")
async def contractor_jobs(contractor_id: int, con=Depends(get_connection)):
    exists = await con.fetchval("SELECT 1 FROM contractor WHERE contractor_id = $1", contractor_id)
    if not exists:
        raise HTTPException(status_code=404, detail="Contractor not found")
    rows = await con.fetch(
        "SELECT * FROM job WHERE contractor_id = $1 ORDER BY posted_at DESC, job_id DESC",
        contractor_id,
    )
    return as_dicts(rows)
