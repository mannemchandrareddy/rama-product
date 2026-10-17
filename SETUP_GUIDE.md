# LocalMart — Complete Setup & Execution Guide

> Everything you need to get the app running end-to-end, tested, and ready.

---

## What's Already Done (Code-Complete)

| Component | Status |
|---|---|
| Backend API (FastAPI) — 29 endpoints | Built and Verified |
| Frontend (Next.js) — 21 pages | Built and Compiled |
| Database models (8 tables) | Built |
| Alembic migration | Built |
| Seed data (3 stores, 20 products, 24 listings) | Built |
| Auth (JWT + RBAC) | Built |
| Dockerfiles + docker-compose | Built |
| Backend venv + dependencies | Installed |

---

## What YOU Need to Set Up (3 things)

### 1. Supabase Project (Free — takes 5 minutes)

Supabase provides the **PostgreSQL database** and **user authentication** (login/signup).

**Steps:**
1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Set:
   - **Project name:** `localmart`
   - **Database password:** (choose a strong password — save it!)
   - **Region:** closest to you (e.g., Mumbai for India)
4. Wait ~2 minutes for the project to be created

**Get your credentials** (you'll need these for `.env` files):

| Credential | Where to find it |
|---|---|
| `SUPABASE_URL` | Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Settings > API > `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings > API > `service_role` key (click "Reveal") |
| `SUPABASE_JWT_SECRET` | Settings > API > JWT Settings > JWT Secret |
| `DATABASE_URL` | Settings > Database > Connection String > URI (choose **Session Mode**) |

> **Important:** For `DATABASE_URL`, change `postgresql://` to `postgresql+asyncpg://` because our backend uses async SQLAlchemy.
>
> Example: `postgresql+asyncpg://postgres.xxxxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

---

### 2. Create `.env` Files

#### Backend `.env`
Create file: `backend/.env`

```env
# Supabase
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...YOUR_SERVICE_KEY
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET

# Database (change postgresql:// to postgresql+asyncpg://)
DATABASE_URL=postgresql+asyncpg://postgres.YOUR_PROJECT_ID:YOUR_DB_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# CORS
CORS_ORIGINS=http://localhost:3000

# App
APP_ENV=development
```

#### Frontend `.env.local`
Create file: `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...YOUR_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 3. Create Test Users in Supabase

In the **Supabase Dashboard > Authentication > Users**, create these users:

| Email | Password | Raw User Metadata (JSON) |
|---|---|---|
| `admin.demo@example.com` | `Admin@123456` | `{"name": "Admin", "role": "ADMIN"}` |
| `ravi.demo@example.com` | `Merchant@123456` | `{"name": "Ravi Kumar", "role": "MERCHANT"}` |
| `customer.demo@example.com` | `Customer@123456` | `{"name": "Demo Customer", "role": "CUSTOMER"}` |

**How to add user metadata:**
1. Click "Add user" then "Create new user"
2. Fill email + password
3. In **User Metadata** field, paste the JSON from the table above
4. Click "Create user"

---

## Execute — Step by Step

Once the above 3 things are done, run these commands:

### Step 1: Run Database Migration
```powershell
cd backend
.\venv\Scripts\activate
alembic upgrade head
```
This creates all 8 tables + indexes in your Supabase PostgreSQL.

### Step 2: Seed Sample Data
```powershell
python -m scripts.seed
```
This adds 12 categories, 20 products, 3 stores, and 24 product listings.

### Step 3: Start Backend
```powershell
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
Backend will be at: **http://localhost:8000**

### Step 4: Start Frontend (new terminal)
```powershell
cd frontend
npm run dev
```
Frontend will be at: **http://localhost:3000**

---

## Test Together — What to Verify

### Quick API Test (browser)
Open these URLs to verify the API works:

| URL | Expected |
|---|---|
| http://localhost:8000/api/v1/health | `{"status": "healthy", "database": "healthy"}` |
| http://localhost:8000/api/v1/categories | List of 12 categories |
| http://localhost:8000/api/v1/products | List of 20 products |
| http://localhost:8000/api/v1/stores | List of 3 stores |
| http://localhost:8000/api/v1/search?q=anchor+switch | Search results |
| http://localhost:8000/api/docs | Swagger interactive docs |

### Frontend Flow Test (browser)
1. **Home page** at http://localhost:3000
   - See categories, search bar, hero section
2. **Search** — Type "anchor switch" and see results with prices
3. **Login as Customer** at `/login` with `customer.demo@example.com` / `Customer@123456`
4. **Login as Merchant** at `/login` with `ravi.demo@example.com` / `Merchant@123456`
   - Go to `/merchant/dashboard` and see store stats
5. **Login as Admin** at `/login` with `admin.demo@example.com` / `Admin@123456`
   - Go to `/admin/dashboard` and see platform stats

---

## Summary Checklist

```
[ ] 1. Create Supabase project at supabase.com
[ ] 2. Copy credentials (URL, anon key, service key, JWT secret, DB URL)
[ ] 3. Create backend/.env with credentials
[ ] 4. Create frontend/.env.local with credentials
[ ] 5. Create 3 test users in Supabase Auth dashboard
[ ] 6. Run: alembic upgrade head
[ ] 7. Run: python -m scripts.seed
[ ] 8. Start backend: uvicorn app.main:app --reload --port 8000
[ ] 9. Start frontend: npm run dev
[ ] 10. Open http://localhost:3000 and test!
```

Once you complete steps 1-5, let me know and we'll run and test everything together!
