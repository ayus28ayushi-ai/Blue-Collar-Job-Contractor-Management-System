"""Convert common asyncpg errors into clean HTTP responses.
Reuse this helper in every router so the mapping stays consistent.
"""
from fastapi import HTTPException, status
import asyncpg


def raise_http_from_db(exc: Exception, *, unique_msg: str = "Already exists") -> None:
    """
    UniqueViolation     → 409
    ForeignKey / Restrict → 400
    CheckViolation      → 422
    Anything else is re-raised unchanged.
    """
    if isinstance(exc, asyncpg.exceptions.UniqueViolationError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=unique_msg,
        ) from exc
    if isinstance(
        exc,
        (
            asyncpg.exceptions.ForeignKeyViolationError,
            asyncpg.exceptions.RestrictViolationError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reference (foreign key violation)",
        ) from exc
    if isinstance(exc, asyncpg.exceptions.CheckViolationError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Check constraint violated",
        ) from exc
    raise exc
