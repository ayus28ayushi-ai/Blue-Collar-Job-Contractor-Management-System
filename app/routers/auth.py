from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database.db import get_connection
from app.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.schemas.auth_schema import UserRegister, GoogleLoginRequest
import asyncpg
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from app.config import GOOGLE_CLIENT_ID



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


# Login or register using Google
@router.post("/google")
async def google_login(
    data: GoogleLoginRequest,
    connection=Depends(get_connection)
):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID is not configured"
        )

    # Verify the ID token received from Google
    try:
        google_user = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except Exception as e:
        print("GOOGLE VERIFICATION ERROR:", repr(e))
        raise HTTPException(
            status_code=401,
            detail="Invalid Google ID token"
        )

    email = google_user.get("email", "").strip().lower()
    google_sub = google_user.get("sub")
    email_verified = google_user.get("email_verified", False)

    if not email or not google_sub or not email_verified:
        raise HTTPException(
            status_code=401,
            detail="Google account email could not be verified"
        )

    # First check whether this Google account already exists
    user = await connection.fetchrow(
        """
        SELECT user_id, email, role, is_active
        FROM app_user
        WHERE google_sub = $1
        """,
        google_sub
    )

    if user is None:
        # Check whether this email already has an account
        user = await connection.fetchrow(
            """
            SELECT user_id, email, role, is_active, google_sub
            FROM app_user
            WHERE email = $1
            """,
            email
        )

        if user:
            # Link the verified Google account to the existing account
            if user["google_sub"] and user["google_sub"] != google_sub:
                raise HTTPException(
                    status_code=409,
                    detail="This email is already linked to another Google account"
                )

            await connection.execute(
                """
                UPDATE app_user
                SET google_sub = $1
                WHERE user_id = $2
                """,
                google_sub,
                user["user_id"]
            )

        else:
            # Create a new account with the selected role
            try:
                user = await connection.fetchrow(
                    """
                    INSERT INTO app_user
                        (email, google_sub, role, auth_provider)
                    VALUES ($1, $2, $3, 'google')
                    RETURNING user_id, email, role, is_active
                    """,
                    email,
                    google_sub,
                    data.role
                )

            except asyncpg.UniqueViolationError:
                raise HTTPException(
                    status_code=409,
                    detail="An account with this Google email already exists"
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
        "message": "Google login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"]
        }
    }

