import asyncpg
from fastapi import HTTPException
 
 
# turns a postgres constraint error into a proper http error
def raise_http_error(exc: Exception, what: str = "Record"):
    if isinstance(exc, asyncpg.UniqueViolationError):
        raise HTTPException(status_code=409, detail=f"{what} already exists")
    if isinstance(exc, (asyncpg.ForeignKeyViolationError, asyncpg.RestrictViolationError)):
        raise HTTPException(status_code=409, detail=f"{what} is linked to other records, so it cannot be changed or deleted")
    if isinstance(exc, asyncpg.CheckViolationError):
        raise HTTPException(status_code=422, detail=f"Invalid value for {what}")
    raise exc
 
