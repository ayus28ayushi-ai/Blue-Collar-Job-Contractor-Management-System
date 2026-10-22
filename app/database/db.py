import asyncpg
from app.config import DATABASE_URL
from fastapi import Request

# to create db connection pool when the app starts
async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)

# each web req will borrow the db connection
async def get_connection(req: Request):
    async with req.app.state.pool.acquire() as con:
        async with con.transaction():  # prevents commits if some error occurs midway
            yield con