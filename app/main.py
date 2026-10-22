from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from app.database.db import get_connection, create_pool

# initialising and closing database connections as the app starts and stops
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    await app.state.pool.close()

app = FastAPI(
    title="Blue-Collar Job & Contractor Management System",
    description="ADD SOMETHING",
    lifespan=lifespan
)

# simple check endpoint to verify db connectivity
@app.get("/systemcheck", tags=["System"])
async def root(connection=Depends(get_connection)):
    row = await connection.fetchrow("SELECT current_database() AS db, version() AS pg")
    return {
        "status": "ok",
        "db": row["db"],
        "postgres": row["pg"].split(",")[0]
    }

