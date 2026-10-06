# Blue-Collar Job & Contractor Management System


---

## READ BEFORE YOU START

Follow these steps in order. Do not skip any.

### 1. Prerequisites
- Python 3.11 or newer
- PostgreSQL installed and running locally (remember your postgres password)
- Git

### 2. Clone the repo
```bash
git clone https://github.com/ayus28ayushi-ai/Blue-Collar-Job-Contractor-Management-System.git

```

### 3. Create and activate your virtual environment
Create it **inside the project folder** and name it exactly `venv` (it is already in `.gitignore`).

```bash
python -m venv venv
venv\Scripts\activate
```
Your terminal prompt should now start with `(venv)`.
**Activate it every time you open a new terminal.**

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Set up your environment file
```bash
copy .env.example .env
```
 
Open `.env` and put your own local PostgreSQL details in `DATABASE_URL`.
**Never commit `.env`.**

### 6. Create your local database
Everyone uses their **own local database** with the same name .Create it in pgAdmin or with:
```bash
createdb BLUE_COLLAR
```

### 7. Run the app
```bash
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs to use the Swagger page. (once api endpoints are done)

### 8. Check git before your first commit
```bash
git status
```
If `venv/` or `.env` appears in the list, **stop and tell the team**. Do not commit them.

---

## Git workflow

- `main` always stays working. **Never commit or push directly to `main`.**
- Commit small and often, with clear messages (for example: "Add worker skills endpoint").
- Push your branch:
```bash
  git push -u origin <your_branch_name>
```
- 
- **Before starting work each day:** switch to `main`, `git pull`, then update your branch.
- After a merge, everyone pulls `main` and re-runs `pip install -r requirements.txt` if packages changed.


---

 

## Project structure

```
sql/        schema, views, seed data and the query catalogue
app/        FastAPI app (db connection, routers, Pydantic schemas)
scripts/    seed generators and the database setup script
tests/      pytest test cases
docs/       project documentation sections
```

---

 