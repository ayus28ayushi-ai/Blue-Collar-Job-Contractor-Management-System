
import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.database.db import get_connection, as_dict, as_dicts
from app.database.errors import raise_http_error
from app.schemas.contractor_schema import ContractorIn
from app.security import require_role

router = APIRouter(prefix="/contractors", tags=["Contractors"])


# Create contractor profile
@router.post("/", status_code=201)
async def create_contractor(
    data: ContractorIn,
    con=Depends(get_connection),
    current_user=Depends(require_role("contractor"))
):
    existing = await con.fetchval(
        "SELECT contractor_id FROM contractor WHERE user_id = $1",
        current_user["user_id"]
    )

    if existing:
        raise HTTPException(409, "Your contractor profile already exists")

    try:
        row = await con.fetchrow(
            """
            INSERT INTO contractor
                (user_id, company_name, contact_person, phone, email, city)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING contractor_id, company_name, contact_person,
                      phone, email, city
            """,
            current_user["user_id"],
            data.company_name,
            data.contact_person,
            data.phone,
            current_user["email"],
            data.city
        )

        return as_dict(row)

    except asyncpg.PostgresError as e:
        raise_http_error(e, "Contractor with this phone or email")


# List contractors
@router.get("/")
async def list_contractors(
    con=Depends(get_connection),
    current_user=Depends(require_role("worker", "contractor", "admin"))
):
    rows = await con.fetch(
        """
        SELECT contractor_id, company_name, contact_person,
               phone, email, city
        FROM contractor
        ORDER BY contractor_id
        """
    )

    return as_dicts(rows)


# Get contractor details
@router.get("/{contractor_id}")
async def get_contractor(
    contractor_id: int,
    con=Depends(get_connection),
    current_user=Depends(require_role("worker", "contractor", "admin"))
):
    row = await con.fetchrow(
        """
        SELECT contractor_id, company_name, contact_person,
               phone, email, city
        FROM contractor
        WHERE contractor_id = $1
        """,
        contractor_id
    )

    if row is None:
        raise HTTPException(404, "Contractor not found")

    return as_dict(row)


# Update own profile; admin can update any contractor
@router.put("/{contractor_id}")
async def update_contractor(
    contractor_id: int,
    data: ContractorIn,
    con=Depends(get_connection),
    current_user=Depends(require_role("contractor", "admin"))
):
    existing = await con.fetchrow(
        """
        SELECT contractor_id, user_id
        FROM contractor
        WHERE contractor_id = $1
        """,
        contractor_id
    )

    if existing is None:
        raise HTTPException(404, "Contractor not found")

    if current_user["role"] == "contractor":
        if existing["user_id"] != current_user["user_id"]:
            raise HTTPException(
                403,
                "You can only update your own contractor profile"
            )

    # Email is controlled by the login account.
    # Do not change it through this profile endpoint.
    try:
        row = await con.fetchrow(
            """
            UPDATE contractor
            SET company_name = $1,
                contact_person = $2,
                phone = $3,
                city = $4
            WHERE contractor_id = $5
            RETURNING contractor_id, company_name, contact_person,
                      phone, email, city
            """,
            data.company_name,
            data.contact_person,
            data.phone,
            data.city,
            contractor_id
        )

        return as_dict(row)

    except asyncpg.PostgresError as e:
        raise_http_error(e, "Contractor with this phone")


# Only admins can delete contractor profiles

# Only admins can delete contractor profiles
@router.delete("/{contractor_id}", status_code=204)
async def delete_contractor(
    contractor_id: int,
    con=Depends(get_connection),
    current_user=Depends(require_role("admin"))
):
    # Check whether contractor exists
    contractor = await con.fetchrow(
        "SELECT contractor_id FROM contractor WHERE contractor_id = $1",
        contractor_id
    )

    if not contractor:
        raise HTTPException(
            status_code=404,
            detail="Contractor not found"
        )

    # Check whether contractor has existing jobs
    job = await con.fetchrow(
        "SELECT job_id FROM job WHERE contractor_id = $1 LIMIT 1",
        contractor_id
    )

    if job:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this contractor because they have existing jobs."
        )

    # Delete contractor if no jobs exist
    await con.execute(
        "DELETE FROM contractor WHERE contractor_id = $1",
        contractor_id
    )

    return None

# View jobs posted by a contractor
@router.get("/{contractor_id}/jobs")
async def contractor_jobs(
    contractor_id: int,
    con=Depends(get_connection),
    current_user=Depends(require_role("worker", "contractor", "admin"))
):
    exists = await con.fetchval(
        "SELECT 1 FROM contractor WHERE contractor_id = $1",
        contractor_id
    )

    if not exists:
        raise HTTPException(404, "Contractor not found")

    rows = await con.fetch(
        """
        SELECT *
        FROM job
        WHERE contractor_id = $1
        ORDER BY posted_at DESC, job_id DESC
        """,
        contractor_id
    )

    return as_dicts(rows)
