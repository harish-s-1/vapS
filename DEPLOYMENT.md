# patS — Deployment Guide

## Architecture

```
                ┌──────────────┐        HTTPS        ┌──────────────────┐
   Browser ───▶ │  Vercel      │ ─────────────────▶ │  Railway/Render  │
                │  (Next.js)   │   /api/v1/*         │  (FastAPI)       │
                └──────────────┘                     └─────────┬────────┘
                                                               │
                                       ┌───────────────────────┼─────────────────┐
                                       ▼                       ▼                  ▼
                                 ┌───────────┐         ┌──────────────┐   ┌──────────────┐
                                 │ Supabase  │         │ Gemini API   │   │ Twilio/Vapi  │
                                 │ Postgres+ │         │ (AI safety,  │   │ (voice calls)│
                                 │ Storage   │         │  narration)  │   └──────────────┘
                                 └───────────┘         └──────────────┘
```

## 1. Database — Supabase

1. Create a Supabase project; copy the connection string and keys.
2. Run the schema:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" -f database/schema.sql
   ```
3. Create a Storage bucket `vault` (private) for uploaded records.

## 2. Backend — Railway or Render

- **Build:** `pip install -r backend/requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (root dir = `backend/`)
- **Env vars:** copy from `backend/.env.example` — set a strong `JWT_SECRET`,
  the Supabase `DATABASE_URL` (use the `postgresql+asyncpg://` driver), `FRONTEND_ORIGIN`
  (your Vercel URL), and integration keys.

## 3. Frontend — Vercel

- Import the repo; framework auto-detected as Next.js.
- **Env vars:** `NEXT_PUBLIC_API_URL=https://<your-api-host>/api/v1` plus the
  public Supabase URL/anon key.
- Deploy. Vercel handles build & CDN automatically.

## 4. Post-deploy checklist

- [ ] `GET /health` returns `ok`
- [ ] CORS allows the Vercel origin
- [ ] `JWT_SECRET` rotated off the default
- [ ] HTTPS enforced end-to-end
- [ ] Supabase RLS policies enabled on patient-owned tables
- [ ] Rate limits tuned for production traffic
- [ ] Audit logging verified for access events

## Local one-box

```bash
# terminal 1
cd backend && uvicorn app.main:app --reload --port 8000
# terminal 2
npm run dev
```
