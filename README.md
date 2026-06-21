# patS

### Patient-Sovereign Prescription Intelligence Network

A production-grade healthcare platform that puts patients in control of their health
records — with doctor-verified digital prescriptions, an AI clinical-safety engine,
medication adherence monitoring, emergency access, and intelligent care coordination.

> Design language: **Apple Health × Stripe × Notion** — soft neomorphism, a calm
> sage-green healthcare palette, and Apple-level polish.

---

## ✨ What's built

**Frontend (fully runnable, no external services required)**
A complete Next.js 15 app implementing all four role experiences against a typed,
in-memory data layer so every screen is interactive out of the box:

| Role | Screens |
|------|---------|
| **Patient** | Dashboard · Health Vault · Prescriptions (QR) · Appointments · Medications · Care Coordinator · Health Timeline · Emergency Card · Consent Center · Guardian Recovery · Voice Assistant |
| **Doctor** | Dashboard · Patients · Create Prescription · **AI Clinical Safety Engine** · Risk Alerts · Access Requests |
| **Pharmacy** | Dashboard · QR Scanner / Verification · Manual Verify · Dispensing History |
| **Admin** | Console · Users · Analytics · Security Events · System Health |

Plus: landing page, login (role-aware), registration, forgot-password & **guardian recovery** flow, JWT-style session, and **role-based route protection**.

**Backend (FastAPI scaffold, clean architecture)**
- JWT auth (access + refresh), bcrypt password hashing
- RBAC dependency guards (`require_roles(...)`)
- Auth, Prescriptions (create / verify / list), and the **AI Clinical Safety** rules engine
- Rate limiting (SlowAPI), CORS, health check
- SQLAlchemy async models + Pydantic schemas

**Database** — complete PostgreSQL schema (`database/schema.sql`): 20+ tables, enums,
foreign keys, indexes (incl. trigram search), audit log, and an `updated_at` trigger.

> **Honesty note:** The frontend is fully functional today on mock data. The backend
> is a real, clean scaffold covering auth + prescriptions + AI safety; the remaining
> modules' endpoints, live Supabase storage, Gemini narration, and Twilio/Vapi calling
> are wired as integration points (env vars + service stubs) rather than fully
> implemented. See the roadmap below.

---

## 🧱 Tech stack

**Frontend:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer-ready · Zustand · lucide-react · qrcode
**Backend:** FastAPI · SQLAlchemy 2 (async) · Pydantic v2 · python-jose · passlib · SlowAPI
**Data:** PostgreSQL / Supabase · Supabase Storage
**AI / Voice:** Gemini API · Twilio + Vapi
**Deploy:** Vercel (web) · Railway / Render (api)

---

## 🚀 Quick start

### Frontend
```bash
npm install
cp .env.example .env.local        # optional for the demo
npm run dev                        # http://localhost:3000
```
On the login screen, pick a role (Patient / Doctor / Pharmacy / Admin) and click
**Sign in** — no password needed in demo mode.

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000           # docs at /docs
```

### Database
```bash
psql "$DATABASE_URL" -f database/schema.sql
```

---

## 📁 Project structure

```
pats/
├── src/
│   ├── app/
│   │   ├── (app)/               # authenticated, role-gated route group
│   │   │   ├── dashboard/  vault/  prescriptions/  appointments/
│   │   │   ├── medications/ care/ timeline/ emergency/ consent/
│   │   │   ├── guardians/ voice/
│   │   │   ├── doctor/     (patients, prescribe, safety, alerts, access)
│   │   │   ├── pharmacy/   (scan, verify, history)
│   │   │   └── admin/      (users, analytics, security, system)
│   │   ├── login/ register/ forgot-password/
│   │   ├── page.tsx             # landing
│   │   └── globals.css          # patS design system
│   ├── components/  (ui/, shell/, auth/)
│   └── lib/         (types, mock-data, store, nav, utils)
├── backend/
│   └── app/  (core/, db/, routers/, services/, models.py, schemas.py, main.py)
├── database/schema.sql
└── README.md
```

---

## 🎨 Design system

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| Primary Green | `#4CAF50` | Background | `#F8FAF8` |
| Accent Emerald | `#22C55E` | Surface | `#FFFFFF` |
| Sage | `#DDEEDD` | Primary Text | `#1F2937` |
| Info Blue | `#60A5FA` | Secondary Text | `#64748B` |
| Warning | `#F59E0B` | Danger | `#EF4444` |

Radii 16–24px · 8px spacing system · soft neomorphic shadows (`shadow-neu-out`,
`shadow-card`) defined in `tailwind.config.ts`.

---

## 🔐 Security

JWT (access + refresh) · bcrypt hashing · RBAC guards · input validation (Pydantic) ·
rate limiting · audit logging table · per-record consent with auto-expiry ·
emergency access that exposes **only** the emergency card and logs every view.

---

## 🔌 API

### Live (Next.js Route Handlers — runs today, persistent on-disk store)
The **Prescription Lifecycle** module is wired end-to-end in the running app:
doctor issues → server persists to `.data/prescriptions.json` → pharmacy verifies by code.
```
POST  /api/prescriptions                   issue (doctor)  → persisted
GET   /api/prescriptions[?patient=Name]    list (patient/pharmacy)
GET   /api/prescriptions/verify/{code}     verify authenticity (public, QR-style)

POST  /api/consent                         request access (doctor/pharmacy)
GET   /api/consent[?patient=|?requester=]  list (auto-expires stale grants on read)
PATCH /api/consent/{id}  {decision}        approve | reject | revoke (patient)

POST   /api/vault                          upload a record (metadata)
GET    /api/vault[?patient=&category=&q=]  list with server-side search + filter
DELETE /api/vault/{id}                     delete a record

GET   /api/medications[?patient=]          list with live-computed adherence
GET   /api/medications/summary[?patient=]  aggregated adherence (feeds dashboard donut)
POST  /api/medications/{id}/dose {status}  log taken | missed | skipped → recomputes

POST  /api/appointments                    book (patient)
GET   /api/appointments[?patient=&status=] list (upcoming count feeds dashboard)
PATCH /api/appointments/{id}               cancel | complete | reschedule

GET    /api/guardians[?patient=]           guardians + recovery state
POST   /api/guardians                      add a guardian
DELETE /api/guardians/{id}                 remove a guardian
POST   /api/guardians/recovery {action}    approve | reset (threshold state machine)

GET   /api/timeline[?patient=]             events + AI-generated summary
POST  /api/timeline                        add an event (summary regenerates)

GET   /api/voice[?patient=]                reminder log + Twilio status
POST  /api/voice {type,to,date,time}       send/schedule an SMS reminder via Twilio

POST  /api/safety/scan                     run the 4-agent pipeline → SafetyReport
GET   /api/safety/report[?patient=]        latest persisted report (auto-runs if none)
GET   /api/safety/log[?patient=]           agent decision log (audit trail)
```

### 🛡️ Autonomous AI Safety Agents (`src/server/agents/`)
Four independent agents run automatically whenever a prescription is uploaded
(wired into `POST /api/prescriptions`) and can be re-run on demand. Each returns a
severity, explanation, UI status, and is recorded in an append-only decision log.

| Agent | Detects | Severity |
|------|---------|----------|
| 1 · Medication Mixing | duplicate active ingredients (cross-brand), interactions, dose accumulation | medium/high |
| 2 · Allergy Prevention | medicines that conflict with allergies via drug-family mapping (Amoxicillin→Penicillin) | high |
| 3 · Fraud Detection | behavioral fraud — same drug from N doctors in 7 days, doctor shopping, controlled-substance abuse (with confidence score, flags not blocks) | medium/high |
| 4 · Dosage Reminders | converts prescriptions → schedules + today's dose timeline + adherence | low |

**Master engine** (`engine.ts`) runs the pipeline `Fraud → Allergy → Mixing → Dosage →
Notifications`, aggregates severity, persists the report, and logs every decision.
Knowledge base in `drug-knowledge.ts` (brand→ingredient, ingredient→family,
interactions, controlled substances, max daily doses) is the **Gemini augmentation
point**.

> **The agents are invisible background services — there is no AI dashboard.** Alerts
> surface *only in context*: allergy & fraud findings tint the relevant **Prescription**
> cards (red, with an `ALLERGY ALERT` / `FRAUD ALERT` badge and a detail side-panel);
> mixing findings tint the relevant **Medication** cards (red, warning icon, "tap for
> details" popup); dosage reminders appear naturally in the medication list and
> dashboard. `src/lib/safety.ts` maps the report onto the right cards.
Client wrappers in `src/lib/api.ts`; stores in `src/server/`. Wired into the doctor
*Create Prescription* / *Access Requests*, pharmacy *Scan/Verify*, and patient
*Prescriptions* / *Consent Center* / *Health Vault* / *Medications* screens. Consent
grants auto-expire after 7 days; the Vault does real server-side search & category
filtering; logging a dose recomputes adherence live on the Medications page **and** the
dashboard donut.

### FastAPI (production backend target — same contract, RBAC + Postgres)
```
POST /api/v1/auth/register · POST /api/v1/auth/login · GET /api/v1/auth/me
POST /api/v1/prescriptions (doctor) · GET /api/v1/prescriptions/verify/{code} · GET /api/v1/prescriptions/mine
POST /api/v1/safety/check (doctor/pharmacy/admin) · GET /health
```

---

## 🗺️ Implementation roadmap

1. ✅ Design system + role-based shell + all UI screens (mock data)
2. ✅ Auth flows (login/register/forgot/guardian) + route protection
3. ✅ FastAPI auth + prescriptions + AI safety + Postgres schema
4. ✅ **Prescription Lifecycle wired end-to-end** (live Next.js API + persistent store; doctor issue → pharmacy verify)
5. ✅ **Digital Consent wired end-to-end** (doctor request → patient approve/reject/revoke → 7-day auto-expiry)
6. ✅ **Health Vault wired end-to-end** (upload → server-side search/filter → delete, persistent)
7. ✅ **Medications wired end-to-end** (log dose → live-computed adherence feeding the dashboard donut)
8. ✅ **Appointments wired end-to-end** (book → cancel/reschedule → upcoming count feeds the dashboard)
9. ✅ **Guardian Recovery wired end-to-end** (manage guardians → threshold-approval state machine → access restored)
10. ✅ **Health Timeline wired end-to-end** (add event → server-generated AI summary regenerates; Gemini plug-in point)
11. ⏳ Point the live API at the FastAPI/Supabase backend via `NEXT_PUBLIC_API_URL`
5. ⏳ Supabase Storage uploads for the Health Vault
6. ⏳ Gemini narration for Timeline & Health Insights
7. ✅ **Twilio SMS reminders wired end-to-end** (type + phone + date/time → real SMS when configured, scheduled when a Messaging Service is set; demo-logs otherwise)
8. ⏳ Remaining routers (consent, medications, appointments, guardians, admin)
9. ⏳ Alembic migrations, tests, CI, observability

---

## ☁️ Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Vercel + Railway/Render + Supabase steps.

---

© 2026 patS Health · Built to be launched to real hospitals and providers.
