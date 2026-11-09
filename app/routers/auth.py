from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database.db import get_connection
from app.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.schemas.auth_schema import UserRegister


router = APIRouter(prefix="/auth", tags=["Authentication"])

# Register a new user
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user: UserRegister,
    connection=Depends(get_connection)
):

    email = user.email.strip().lower()

    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid email address"
        )

    hashed_password = hash_password(user.password)

    new_user = await connection.fetchrow(
        """
        INSERT INTO app_user
            (email, password_hash, role, auth_provider)
        VALUES ($1, $2, $3, 'password')
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id, email, role
        """,
        email,
        hashed_password,
        user.role
    )

    if new_user is None:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists"
        )

    return {
        "message": "Registration successful",
        "user": dict(new_user)
    }


# Login using email and password
@router.post("/login")
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    connection=Depends(get_connection)
):

    email = form_data.username.strip().lower()

    user = await connection.fetchrow(
        """
        SELECT user_id, email, password_hash, role, is_active
        FROM app_user
        WHERE email = $1
        """,
        email
    )

    if (
        not user
        or not user["password_hash"]
        or not verify_password(form_data.password, user["password_hash"])
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated"
        )

    access_token = create_access_token(
        user_id=user["user_id"],
        role=user["role"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"]
        }
    }
