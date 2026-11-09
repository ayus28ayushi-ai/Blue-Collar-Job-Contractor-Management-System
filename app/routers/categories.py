import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection, as_dict, as_dicts
from app.database.errors import raise_http_error
from app.schemas.categories_schema import CategoryIn
from app.security import require_role

router = APIRouter(prefix="/categories", tags=["Job Categories"])

@router.post("/", status_code=201)
async def create_category(data: CategoryIn, con=Depends(get_connection), current_user=Depends(require_role("admin"))):
    try:
        row = await con.fetchrow(
            "INSERT INTO job_category (category_name) VALUES ($1) RETURNING *",
            data.category_name,
        )
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Category")
    return as_dict(row)


@router.get("/")
async def list_categories(con=Depends(get_connection)):
    rows = await con.fetch("SELECT * FROM job_category ORDER BY category_id")
    return as_dicts(rows)


@router.get("/{category_id}")
async def get_category(category_id: int, con=Depends(get_connection)):
    row = await con.fetchrow("SELECT * FROM job_category WHERE category_id = $1", category_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return as_dict(row)


@router.put("/{category_id}")
async def update_category(category_id: int, data: CategoryIn, con=Depends(get_connection), current_user=Depends(require_role("admin"))):
    try:
        row = await con.fetchrow(
            "UPDATE job_category SET category_name = $1 WHERE category_id = $2 RETURNING *",
            data.category_name, category_id,
        )
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Category")
    if row is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return as_dict(row)


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: int, con=Depends(get_connection),current_user=Depends(require_role("admin"))):
    try:
        result = await con.execute("DELETE FROM job_category WHERE category_id = $1", category_id)
    except asyncpg.PostgresError as e:
        raise_http_error(e, "Category")
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Category not found")
