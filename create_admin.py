
import asyncio
from getpass import getpass

import asyncpg

from app.config import DATABASE_URL
from app.security import hash_password


async def create_admin():

    print("\n--- Create Admin Account ---")

    email = input("Enter admin email: ").strip().lower()

    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if not email or not password:
        print("Email and password cannot be empty.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    if not DATABASE_URL:
        print("DATABASE_URL is missing from .env")
        return

    password_hash = hash_password(password)

    pool = await asyncpg.create_pool(DATABASE_URL)

    try:
        async with pool.acquire() as conn:

            existing_user = await conn.fetchrow(
                """
                SELECT user_id, role
                FROM app_user
                WHERE LOWER(email) = LOWER($1)
                """,
                email
            )

            if existing_user:
                print(
                    f"An account with this email already exists "
                    f"(role: {existing_user['role']})."
                )
                print("No changes were made.")
                return

            admin = await conn.fetchrow(
                """
                INSERT INTO app_user
                (email, password_hash, google_sub, role,
                 is_active, auth_provider)
                VALUES ($1, $2, NULL, 'admin', TRUE, 'password')
                RETURNING user_id, email, role
                """,
                email,
                password_hash
            )

            print("\nAdmin account created successfully!")
            print("User ID:", admin["user_id"])
            print("Email:", admin["email"])
            print("Role:", admin["role"])

    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(create_admin())
