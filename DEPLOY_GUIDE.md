# 🚀 Deployment Guide — MERN Stack

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Vercel         │  ───▶   │   Render         │  ───▶   │   MongoDB Atlas  │
│   (Frontend)     │         │   (Backend API)  │         │   (Database)     │
│   Next.js        │         │   Express.js     │         │   Free Tier      │
│   React + TS     │         │   Node.js        │         │                  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                                                       │
         └───── Supabase Auth (JWT tokens) ─────────────────────┘
```

---

## Step 1: Set Up MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up / Sign in
2. Create a **Free Shared Cluster** (M0 — Free Forever)
3. Choose **AWS** region closest to you
4. Under **Database Access** → Add a database user (username + password)
5. Under **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere for Render)
6. Click **Connect** → **Drivers** → Copy the connection string
7. Replace `<password>` in the string with your actual password

Your URI will look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/rama_product?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → Sign up / Sign in
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name**: `rama-product-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: Free

6. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://...` (from Step 1) |
| `SUPABASE_URL` | `https://tpmsbpqwldunvgzmzlah.supabase.co` |
| `SUPABASE_JWT_SECRET` | Your Supabase JWT secret |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` (add after Step 3) |
| `APP_ENV` | `production` |
| `PORT` | `8000` |

7. Click **Deploy** → Wait for it to go live
8. Note your Render URL: `https://rama-product-api.onrender.com`

---

## Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up / Sign in
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`

5. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://rama-product-api.onrender.com` (from Step 2) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tpmsbpqwldunvgzmzlah.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

6. Click **Deploy**

---

## Step 4: Update CORS on Render

After Vercel deploys, go back to Render and update:
```
CORS_ORIGINS=https://your-app.vercel.app
```
(Use your actual Vercel URL)

---

## Local Development

### Backend (server/)
```bash
cd server
npm install
# Edit .env with your MongoDB URI and Supabase credentials
npm run dev
```
Runs on `http://localhost:8000`

### Frontend (frontend/)
```bash
cd frontend
npm install
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
npm run dev
```
Runs on `http://localhost:3000`

---

## API Endpoints

All endpoints are under `/api/v1/`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/auth/sync` | Bearer | Sync user from Supabase |
| GET | `/auth/me` | Bearer | Get current user |
| PUT | `/auth/me` | Bearer | Update profile |
| GET | `/users` | Admin | List users |
| POST | `/merchants/profile` | Merchant | Create merchant profile |
| GET | `/merchants/me` | Merchant | Get merchant profile |
| POST | `/stores` | Merchant | Create store |
| GET | `/stores/my` | Merchant | Merchant's stores |
| GET | `/stores/:id` | — | Store detail |
| GET | `/stores` | — | List approved stores |
| PUT | `/stores/:id/approval` | Admin | Approve/reject store |
| GET | `/products` | — | List products |
| GET | `/products/:id` | — | Product detail + listings |
| POST | `/products` | Admin | Create product |
| POST | `/listings` | Merchant | Create listing |
| PUT | `/listings/:id` | Merchant | Update listing |
| GET | `/listings/my` | Merchant | Merchant's listings |
| GET | `/categories` | — | List categories |
| GET | `/search` | — | Search products |
| GET | `/search/suggestions` | — | Autocomplete |
| POST | `/reports` | Bearer | Submit report |
| GET | `/reports` | Admin | List reports |
| GET | `/admin/stats` | Admin | Dashboard stats |
| POST | `/events` | — | Log event |
| GET | `/events/stats` | Admin | Event analytics |
