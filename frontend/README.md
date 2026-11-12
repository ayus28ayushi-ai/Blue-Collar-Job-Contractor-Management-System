# Worksite (frontend)

React + Vite + TypeScript + Tailwind + TanStack Query + sonner. Talks to the existing FastAPI backend with **no backend changes**.

    cp .env.example .env     # set VITE_API_BASE_URL
    npm install && npm run dev

The backend needs CORS enabled for the dev origin (http://localhost:5173) or the browser will block requests.
`app/main.py` doesn't add CORSMiddleware today. That is the only thing outside this repo you must configure,
and it can be done with a dev proxy instead (add `server.proxy` in vite.config.ts and point VITE_API_BASE_URL at the Vite origin).

## Roles
- worker: browse/search jobs, apply, withdraw, rate completed jobs
- contractor: post jobs (POST /jobs/with-skills), start/complete/cancel, shortlist/accept/reject, record payments
- admin: all jobs, applicants, workers, Insights

## How the client works around the API as it exists
| Gap in the API | Client behaviour |
|---|---|
| No `GET /jobs` list | Uses `/jobs/search?status=` (one call per status for "all"); contractors use `/contractors/{id}/jobs` |
| `/jobs/search` rows have no `status`, no `contractor_id` | Status is tagged from the query; full detail is loaded from `/jobs/{id}` in the drawer |
| No "me" endpoint | Contractor profile found by matching login email in `GET /contractors/`; worker id remembered in localStorage after `POST /workers` |
| Two status routes (`PATCH` and `PUT /jobs/{id}/status`) | `in_progress`/`completed` use PATCH; `cancelled` is only accepted by PUT |
| `/auth/login` is form-encoded | Sent as `application/x-www-form-urlencoded` |
| 422 arrays | Parsed into `ApiError.fields`, shown inline per field |
| No pagination | Lists are client-filtered; fine for demo-sized data |
