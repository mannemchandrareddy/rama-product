# LocalMart — Local Commerce Intelligence Platform

> **Find any product at nearby local stores.** Compare prices, check availability, get directions — all in one place.

LocalMart connects customers searching for specific physical products with nearby local stores, showing price, availability, distance, and contact info. Merchants list their products and prices; admins moderate the platform.

---

## Architecture

```
┌─────────────────┐     API calls     ┌─────────────────┐
│   Next.js 15    │ ───────────────►  │    FastAPI       │
│   (Frontend)    │                   │    (Backend)     │
│   TypeScript    │  ◄───────────────  │    Python 3.11+  │
│   Tailwind CSS  │     JSON          │    SQLAlchemy 2  │
└─────────────────┘                   └────────┬────────┘
                                               │ SQL
                                      ┌────────▼────────┐
                                      │   PostgreSQL     │
                                      │   (Supabase)     │
                                      │   + Auth         │
                                      └─────────────────┘
```

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS v4 (App Router) |
| **Backend** | Python + FastAPI + Pydantic + SQLAlchemy 2.0 + Alembic |
| **Database** | PostgreSQL via Supabase (free tier) |
| **Auth** | Supabase Auth + JWT validation in FastAPI |
| **Deployment** | Vercel (frontend) + Render (backend) + Supabase (DB) |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- A **Supabase** project ([supabase.com](https://supabase.com))

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
alembic upgrade head

# (Optional) Seed with sample data
python -m scripts.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Project Structure

```
rama_product/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (13 modules)
│   │   ├── core/            # Config, security, dependencies
│   │   ├── database/        # Engine, session, base model
│   │   ├── middleware/       # CORS, request logging
│   │   ├── models/          # SQLAlchemy ORM (8 tables)
│   │   ├── schemas/         # Pydantic request/response
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Geo, time utilities
│   │   └── main.py          # FastAPI app factory
│   ├── alembic/             # Database migrations
│   ├── scripts/             # Seed data
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── admin/       # Admin panel (7 pages)
│   │   │   ├── merchant/    # Merchant dashboard (4 pages)
│   │   │   ├── search/      # Product search
│   │   │   ├── product/     # Product detail
│   │   │   ├── store/       # Store detail
│   │   │   └── ...          # Auth, profile, categories
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # useAuth, useDebounce, useGeolocation
│   │   ├── lib/             # API client, Supabase, constants
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Formatters, helpers
│   └── package.json
│
└── README.md
```

---

## Key Features

### For Customers
- 🔍 **Full-text search** with fuzzy matching (handles typos)
- 🏪 **Compare prices** across multiple stores for the same product
- 📍 **Distance-aware** results with geolocation support
- 📞 **One-tap call** and Google Maps directions
- 🚩 **Report** incorrect prices or store info

### For Merchants
- 📦 **Product listings** — set prices and stock status
- 🏬 **Store management** — register and manage store info
- 📊 **Dashboard** — overview of listings and activity

### For Admins
- ✅ **Store approval** workflow (pending → approved/rejected)
- 👥 **User management** with role-based access
- 📋 **Listing oversight** — deactivate problematic listings
- 📂 **Category & product** catalogue management
- 🚩 **Report queue** with status management
- 📊 **Platform statistics** — real data, no fake numbers

---

## API Endpoints

All endpoints are under `/api/v1/`. Interactive docs available at `/api/docs` (dev only).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/sync` | Auth | Sync Supabase user to backend |
| GET | `/search` | Public | Full-text product search |
| GET | `/products/{id}` | Public | Product detail + price comparison |
| GET | `/stores/{id}` | Public | Store detail + listings |
| GET | `/categories` | Public | Active categories |
| POST | `/stores` | Merchant | Create store |
| POST | `/listings` | Merchant | Create product listing |
| PUT | `/listings/{id}` | Merchant | Update price/stock |
| GET | `/admin/stats` | Admin | Platform statistics |
| PUT | `/stores/{id}/approval` | Admin | Approve/reject store |
| GET | `/reports` | Admin | Report queue |

---

## Environment Variables

### Backend (`.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret for token validation |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |

### Frontend (`.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Security

- **RBAC** enforced on every endpoint via FastAPI dependencies
- **Merchant isolation** — merchants can only modify their own stores/listings
- **Parameterized queries** via SQLAlchemy (no SQL injection)
- **Rate limiting** via slowapi
- **CORS** restricted to frontend origin
- **Input validation** via Pydantic schemas
- **No secrets in source** — `.env.example` templates only

---

## License

Private — all rights reserved.
