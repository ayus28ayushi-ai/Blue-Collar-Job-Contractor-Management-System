# Worksite — Blue-Collar Job & Contractor Management System

A full-stack platform that connects blue-collar workers with contractors. Workers can create profiles, showcase their skills, discover suitable work and track applications. Contractors can publish job opportunities, review applicants and manage hiring progress. Administrators have access to platform-level user and analytics views.

---

## Contents

- [Worksite — Blue-Collar Job \& Contractor Management System](#worksite--blue-collar-job--contractor-management-system)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Features](#features)
    - [Worker features](#worker-features)
    - [Contractor features](#contractor-features)
    - [Administrator features](#administrator-features)
    - [Platform features](#platform-features)
  - [User roles](#user-roles)
  - [Technology stack](#technology-stack)
  - [Architecture](#architecture)
  - [Database model](#database-model)
  - [Getting started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [1. Get the project](#1-get-the-project)
    - [2. Configure the backend](#2-configure-the-backend)
    - [3. Create and initialize the database](#3-create-and-initialize-the-database)
    - [4. Start the backend](#4-start-the-backend)
    - [5. Configure and start the frontend](#5-configure-and-start-the-frontend)
  - [Google Sign-In setup](#google-sign-in-setup)
  - [API documentation](#api-documentation)
    - [Authentication endpoints](#authentication-endpoints)
  - [Project structure](#project-structure)
  - [Security](#security)
  - [Development notes](#development-notes)
  - [Contributors](#contributors)

## Overview

Worksite provides a shared workspace for managing the main stages of blue-collar hiring:

1. Workers register and maintain a profile containing their experience, availability and skills.
2. Contractors create job listings with a category, location, pay details, dates, required workers and required skills.
3. Workers browse available jobs and submit applications.
4. Contractors review applications and update their status.
5. Completed work can be associated with payments and ratings.
6. Administrators can review users and platform analytics.

The backend exposes a REST API, while the React frontend consumes those endpoints.

## Features

### Worker features
- Register and sign in using email/password or Google.
- Create and update a worker profile.
- Add skills, proficiency levels and years of experience.
- Browse and search job listings.
- Apply for jobs and view application progress.

### Contractor features
- Create and manage a contractor/company profile.
- Publish jobs, including jobs with required skills.
- View workers and inspect skill information.
- Review applications and update their status.
- View matching workers for a job.

### Administrator features
- Access role-protected administrative functionality.
- View worker and contractor users.
- View analytics covering applications, contractors, pay, skills and worker ratings.

### Platform features
- Role-aware frontend navigation.
- PostgreSQL persistence.
- JWT-based API authentication.
- Password hashing for password-based accounts.
- Google Identity Services sign-in using a verified Google ID token.
- API request/response validation with Pydantic schemas.
- Interactive API documentation through FastAPI Swagger UI.

## User roles

| Role | Main permissions |
|---|---|
| **Worker** | Manage own worker profile and skills, browse jobs, apply and track applications. |
| **Contractor** | Manage contractor profile, create jobs, view workers and manage applications for jobs. |
| **Admin** | Access administrative user views and analytics, in addition to permitted platform operations. |

Public registration supports the `worker` and `contractor` roles. Admin accounts are not created through the public registration form; an administrator account must be provisioned separately.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling and UI | Tailwind CSS, Lucide React, Sonner |
| Client-side data | TanStack Query |
| Routing | React Router |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL, asyncpg |
| Authentication | JWT (PyJWT), Google Auth |
| Password hashing | pwdlib |
| Validation/configuration | Pydantic, python-dotenv |

## Architecture

```text
┌──────────────────────────────────────┐
│           React + TypeScript         │
│       Vite · React Router · Query    │
└──────────────────┬───────────────────┘
                   │ HTTP / JSON
                   ▼
┌──────────────────────────────────────┐
│              FastAPI                 │
│  Routers · Pydantic Schemas ·        │
│  Authentication · Role Checks       │
└──────────────────┬───────────────────┘
                   │ asyncpg
                   ▼
┌──────────────────────────────────────┐
│             PostgreSQL               │
│ Users · Workers · Contractors ·      │
│ Jobs · Skills · Applications ·       │
│ Payments · Ratings                   │
└──────────────────────────────────────┘
```

The frontend is served by Vite during development. FastAPI provides the API and manages a PostgreSQL connection pool during the application lifespan.

## Database model

The SQL schema is organized around these main entities:

- **app_user** — login identity, email, password hash or Google subject, role and account status.
- **worker** — worker profile, contact details, city, experience, expected wage and availability.
- **contractor** — company and contact-person information.
- **skill** — skills that can be associated with workers and jobs.
- **worker_skill** — worker-to-skill relationship, including proficiency and experience.
- **job_category** — job classification.
- **job** — contractor-created work listing, pay details, location, dates and status.
- **job_skill** — skills and minimum experience required for a job.
- **application** — a worker's application to a job and its status.
- **payment** — payment information associated with an application.
- **rating** — rating and comment associated with an application.

The authentication schema links worker and contractor profiles to their corresponding `app_user` account.

## Getting started

### Prerequisites

Install the following before running the project:

- Python 3.11 or later
- Node.js 18 or later (npm included)
- PostgreSQL
- Git (optional, for cloning the repository)

### 1. Get the project

```bash
git clone <YOUR_REPOSITORY_URL>
cd Blue-Collar-Job-Contractor-Management-System-project2
```

If you downloaded the source as a ZIP, extract it and open a terminal in the extracted project directory.

### 2. Configure the backend

Create and activate a virtual environment from the project root.

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```bat
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a backend environment file by copying `.env.example` to `.env`.

**Windows:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Set the values in the root `.env` file:

```env
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/YOUR_DATABASE
JWT_SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
```

Use your own PostgreSQL username, password and database name. Generate a strong, private JWT secret. Do not commit `.env` or real credentials.

### 3. Create and initialize the database

Create a PostgreSQL database. For example:

```bash
createdb BLUE_COLLAR
```

Alternatively, create a database named `BLUE_COLLAR` using pgAdmin or `psql`.

From the project root, run the schema scripts in this order:

```bash
psql -d BLUE_COLLAR -f sql/schema/schemas.sql
psql -d BLUE_COLLAR -f sql/schema/authentication.sql
```

Optional: insert the sample data:

```bash
psql -d BLUE_COLLAR -f sql/seed/seed.sql
```

> **Note:** The seed script truncates several application tables before inserting its sample dataset. Run it only against a development database whose existing data can be discarded.

### 4. Start the backend

Run this command from the project root, with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:

- API base URL: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 5. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` by copying `frontend/.env.example`.

**Windows:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Set the frontend environment variables:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

To create a production frontend build:

```bash
npm run build
```

## Google Sign-In setup

Google Sign-In requires a Google OAuth 2.0 **Web application** client ID. The same client ID must be configured in both the backend and frontend environment files.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a Google Cloud project.
3. Configure the OAuth consent screen as required for your testing/deployment setup.
4. Open **APIs & Services → Credentials**.
5. Create an **OAuth client ID** with application type **Web application**.
6. Under **Authorized JavaScript origins**, add the exact frontend origins you use, for example:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - Add the relevant deployed frontend origin when deploying.
7. Copy the client ID into both:
   - Backend `.env`: `GOOGLE_CLIENT_ID`
   - Frontend `frontend/.env`: `VITE_GOOGLE_CLIENT_ID`
8. Restart the backend and Vite development server after changing environment variables.

The backend verifies the Google ID token using the configured client ID. The Google client ID is an identifier, not a client secret. Never expose a Google client secret or JWT secret in frontend code.

If Google Sign-In reports an origin or client-ID error, check that the browser URL exactly matches one of the authorized JavaScript origins and that both environment files contain the same client ID.

## API documentation

All routes are registered by the FastAPI application. The interactive Swagger documentation at `/docs` is the most reliable place to inspect request bodies, query parameters, response schemas and authorization requirements.

| Area | Base path | Functionality |
|---|---|---|
| Authentication | `/auth` | Register, password login, Google login and current-user details |
| Categories | `/categories` | Create, list, retrieve, update and delete job categories |
| Skills | `/skills` | Retrieve skills |
| Workers | `/workers` | Worker profiles and worker skills |
| Contractors | `/contractors` | Contractor profiles and contractor job listings |
| Jobs | `/jobs` | Search and manage jobs, create jobs with skills, status updates and matching workers |
| Applications | `/applications` and related job/worker paths | Create, retrieve, list, delete and update applications |
| Payments | `/payments` | Payment operations |
| Ratings | `/ratings` | Rating operations |
| Analytics | `/analytics` | Application, contractor, pay, skill and rating summaries |

### Authentication endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with email/password and a worker or contractor role |
| `POST` | `/auth/login` | Sign in using OAuth2 password-form fields (`username` is the email) |
| `POST` | `/auth/google` | Verify a Google ID token and sign in or register |
| `GET` | `/auth/me` | Return the authenticated user's account and linked profile IDs |

For protected endpoints, send the access token using the `Authorization: Bearer <token>` header. The API returns a JWT access token after successful password or Google login.

## Project structure

```text
.
├── app/
│   ├── database/          # PostgreSQL connection pool and DB helpers
│   ├── routers/           # API route modules
│   ├── schemas/           # Pydantic request/response schemas
│   ├── scripts/           # Backend utility scripts
│   ├── config.py          # Environment-based configuration
│   ├── main.py            # FastAPI application and router registration
│   └── security.py        # Password hashing, JWT and role checks
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Authentication, queries and theme hooks
│   │   ├── lib/           # API client and adapters
│   │   ├── pages/         # Application pages
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── sql/
│   ├── schema/            # Core and authentication schemas
│   └── seed/              # Optional development seed data
├── create_admin.py        # Admin provisioning utility
├── requirements.txt
└── README.md
```

## Security

- Passwords are stored as password hashes rather than plaintext.
- Password verification is performed against the stored hash.
- The backend issues signed JWT access tokens with an expiry.
- Protected endpoints authenticate bearer tokens and check whether the account is active.
- Role-based dependencies restrict access to designated roles.
- Google ID tokens are verified server-side against the configured Google client ID.
- Keep `.env` files and all credentials out of version control.

This project is intended to be configured and run with trusted development credentials. Before production deployment, review secret management, HTTPS, CORS origins, token lifetime and refresh/revocation strategy, database permissions, logging and operational monitoring.

## Development notes

- Backend environment variables are loaded from the project-root `.env`.
- Frontend variables must use the `VITE_` prefix and are read by Vite at build/dev-server startup.
- Restart the relevant development server after changing environment variables.
- The backend CORS configuration currently allows the local frontend origins on ports `5173` and `5174`; update it for your deployment domain.
- Admin accounts are not available through public registration. Use the provided admin provisioning utility only after reviewing its required arguments and database configuration.
- Sample seed records are development data. The seed file does not create fully linked login accounts for every seeded worker or contractor.

---

## Contributors
- Ayushi Singh - [Github Profile](https://github.com/ayus28ayushi-ai)
- K. Srivardhan - [Github Profile](https://github.com/srivardhan-star)
- Bhargava Kambhammettu - [Github Profile](https://github.com/bhargavakam07-droid)
