# Blue-Collar Job & Contractor Management System (Worksite)

Professional platform connecting blue-collar workers with contractors. Includes job posting, applications, skills matching, payments, ratings, and admin analytics.

## Stack

- **Backend:** FastAPI, asyncpg, PostgreSQL, JWT + Google OAuth
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Sonner

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

## 1. Backend setup

```bash
cd Blue-Collar-Job-Contractor-Management-System-project
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/BLUE_COLLAR
JWT_SECRET_KEY=change-me-to-a-long-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Create the database and apply schema:

```bash
createdb BLUE_COLLAR
psql BLUE_COLLAR -f sql/schema/schemas.sql
psql BLUE_COLLAR -f sql/schema/authentication.sql
psql BLUE_COLLAR -f sql/seed/seed.sql   # optional sample data
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger: http://127.0.0.1:8000/docs

## 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

(The Google Client ID must match the backend value and be configured for origin `http://localhost:5173`.)

```bash
npm run dev
```

Open http://localhost:5173

## 3. Google Sign-In configuration

1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID (Web application).
3. Authorized JavaScript origins: `http://localhost:5173`, `http://127.0.0.1:5173`
4. Put the Client ID in both backend `.env` (`GOOGLE_CLIENT_ID`) and frontend `.env` (`VITE_GOOGLE_CLIENT_ID`).

If the Client ID is missing, the UI shows a clear configuration notice and email/password auth still works.

## Roles & main flows

| Role        | Capabilities |
|-------------|--------------|
| **Worker**  | Profile + skills, browse/search jobs, apply, track applications |
| **Contractor** | Company profile, post jobs (with skills), manage applicants & status, view workers |
| **Admin**   | All of the above + Insights analytics + Users (workers/contractors) overview |

After registration (email or Google), complete the role-specific profile on **Profile** before posting jobs or applying.

## Backend endpoints (integrated)

### Auth
- `POST /auth/register` – email/password registration (worker | contractor)
- `POST /auth/login` – OAuth2 password form → JWT
- `POST /auth/google` – Google ID token + optional role
- `GET /auth/me` – current user + linked worker_id / contractor_id

### Categories & Skills
- Full CRUD on `/categories/`
- `POST/GET /skills`, `GET /skills/{id}`

### Workers
- `POST/GET /workers`, `GET/PUT/DELETE /workers/{id}`
- `POST/GET /workers/{id}/skills`

### Contractors
- `POST/GET /contractors/`, `GET/PUT/DELETE /contractors/{id}`
- `GET /contractors/{id}/jobs`

### Jobs
- `POST /jobs` – create
- `POST /jobs/with-skills` – create with required skills
- `GET /jobs/search` – public search by status
- `GET/PUT/DELETE /jobs/{id}`
- `PATCH /jobs/{id}/status` – contractor status transitions
- `PUT /jobs/{id}/status` – alternate status endpoint
- `GET /jobs/{id}/matching-workers`

### Applications
- `POST /applications`
- `GET /applications/{id}`
- `GET /jobs/{id}/applications`
- `GET /workers/{id}/applications`
- `DELETE /applications/{id}`
- `PATCH /applications/{id}/status`

### Payments & Ratings
- `POST /payments`
- `POST /ratings`

### Analytics (admin)
- `GET /analytics/applications-per-job`
- `GET /analytics/top-contractors`
- `GET /analytics/average-pay-by-category`
- `GET /analytics/most-requested-skills`
- `GET /analytics/worker-rating-summary`

## Frontend structure (high level)

- **Landing** – public marketing page with CTAs for workers/contractors
- **Login / Register** – email + Google; role selection on register
- **Shell** – role-aware sidebar (Jobs, Applications, Workers, Insights, Users, Profile)
- **Jobs** – list/search, create (contractor), apply (worker), status management
- **Applications** – worker's own applications
- **Workers** – directory for contractors/admins
- **Insights** – admin analytics charts/tables
- **Admin Users** – workers & contractors tables
- **Profile** – create/complete worker or contractor profile; manage skills

## Notes & limitations

- Admin cannot self-register via the public form (role is restricted to worker/contractor). Create an admin user directly in the database if needed.
- Seed data creates workers/contractors without linked `app_user` rows; use the UI to register and create profiles for full flows.
- Google auth requires a valid Client ID; otherwise only password auth is available.
- Backend is the source of truth — frontend calls existing endpoints only.

## Development tips

- API docs: http://127.0.0.1:8000/docs
- Frontend env changes require restarting Vite.
- CORS is configured for `localhost:5173` and `5174`.
