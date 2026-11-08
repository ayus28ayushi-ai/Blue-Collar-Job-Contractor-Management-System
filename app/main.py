from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from app.database.db import get_connection, create_pool
from app.routers import applications , jobs, auth, categories, contractors, job_posting, payments, ratings, skills, workers


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

app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(contractors.router)
app.include_router(job_posting.router)
app.include_router(payments.router)
app.include_router(ratings.router)
app.include_router(skills.router)
app.include_router(workers.router)

# simple check endpoint to verify db connectivity
@app.get("/systemcheck", tags=["System"])
async def root(connection=Depends(get_connection)):
    row = await connection.fetchrow("SELECT current_database() AS db, version() AS pg")
    return {
        "status": "ok",
        "db": row["db"],
        "postgres": row["pg"].split(",")[0]
    }

