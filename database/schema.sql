-- ============================================================================
-- patS — PostgreSQL Schema
-- Patient-Sovereign Prescription Intelligence Network
-- Healthcare-grade: RBAC, encryption-at-rest assumptions, audit logging.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fuzzy search on records
CREATE EXTENSION IF NOT EXISTS "citext";      -- case-insensitive emails

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('patient', 'doctor', 'pharmacy', 'admin');
CREATE TYPE record_category  AS ENUM ('prescription', 'lab_report', 'scan', 'allergy', 'chronic_condition', 'report');
CREATE TYPE consent_status   AS ENUM ('pending', 'approved', 'rejected', 'expired', 'revoked');
CREATE TYPE rx_status        AS ENUM ('active', 'dispensed', 'expired', 'cancelled');
CREATE TYPE severity_level   AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE call_type        AS ENUM ('medication', 'appointment', 'follow_up');
CREATE TYPE appointment_type AS ENUM ('in_person', 'video', 'lab_test', 'follow_up');

-- ---------------------------------------------------------------------------
-- Users & profiles
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'patient',
    full_name       TEXT NOT NULL,
    phone           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE patient_profiles (
    user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth      DATE,
    blood_group        TEXT,
    height_cm          NUMERIC(5,2),
    weight_kg          NUMERIC(5,2),
    allergies          TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]',
    health_score       SMALLINT DEFAULT 0,
    treatment_score    SMALLINT DEFAULT 0
);

CREATE TABLE doctor_profiles (
    user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_no     TEXT UNIQUE NOT NULL,
    specialty      TEXT,
    hospital       TEXT,
    signature_key  TEXT,                 -- public key / signature reference
    verified       BOOLEAN DEFAULT FALSE
);

CREATE TABLE pharmacy_profiles (
    user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    license_no     TEXT UNIQUE NOT NULL,
    address        TEXT,
    verified       BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- Health Vault (Module 1)
-- ---------------------------------------------------------------------------
CREATE TABLE vault_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    category    record_category NOT NULL,
    provider    TEXT,
    file_url    TEXT,                     -- Supabase Storage object path (encrypted)
    file_size   BIGINT,
    tags        TEXT[] DEFAULT '{}',
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vault_patient   ON vault_records(patient_id);
CREATE INDEX idx_vault_category  ON vault_records(category);
CREATE INDEX idx_vault_title_trgm ON vault_records USING gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Prescriptions (Module 3) + medicines
-- ---------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,           -- VTX-RX-XXXXXXXX
    patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          rx_status NOT NULL DEFAULT 'active',
    signature       TEXT NOT NULL,                  -- digital signature payload
    signature_valid BOOLEAN NOT NULL DEFAULT TRUE,
    qr_payload      TEXT NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ
);
CREATE INDEX idx_rx_patient ON prescriptions(patient_id);
CREATE INDEX idx_rx_doctor  ON prescriptions(doctor_id);
CREATE INDEX idx_rx_code    ON prescriptions(code);

CREATE TABLE prescription_medicines (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id  UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    dosage           TEXT NOT NULL,
    frequency        TEXT NOT NULL,
    duration         TEXT,
    instructions     TEXT
);
CREATE INDEX idx_rxmed_rx ON prescription_medicines(prescription_id);

CREATE TABLE dispensing_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    pharmacy_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_scanned    TEXT NOT NULL,
    result          TEXT NOT NULL,                  -- 'verified' | 'rejected'
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispense_pharmacy ON dispensing_log(pharmacy_id);

-- ---------------------------------------------------------------------------
-- Consent / Access management (Module 2 + 11)
-- ---------------------------------------------------------------------------
CREATE TABLE consent_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope         TEXT NOT NULL,
    status        consent_status NOT NULL DEFAULT 'pending',
    is_emergency  BOOLEAN NOT NULL DEFAULT FALSE,
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at    TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ
);
CREATE INDEX idx_consent_patient   ON consent_requests(patient_id);
CREATE INDEX idx_consent_requester ON consent_requests(requester_id);
CREATE INDEX idx_consent_status    ON consent_requests(status);

-- ---------------------------------------------------------------------------
-- Medications, adherence, appointments (Modules 7 + 8)
-- ---------------------------------------------------------------------------
CREATE TABLE medications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    dosage        TEXT,
    frequency     TEXT,
    schedule      JSONB DEFAULT '[]',               -- array of HH:MM times
    status        TEXT NOT NULL DEFAULT 'active',
    started_at    DATE DEFAULT CURRENT_DATE,
    ended_at      DATE
);
CREATE INDEX idx_med_patient ON medications(patient_id);

CREATE TABLE dose_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    taken_at      TIMESTAMPTZ,
    status        TEXT NOT NULL DEFAULT 'pending'   -- pending|taken|missed|skipped
);
CREATE INDEX idx_dose_med ON dose_events(medication_id);

CREATE TABLE appointments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    type        appointment_type NOT NULL DEFAULT 'in_person',
    scheduled_at TIMESTAMPTZ NOT NULL,
    status      TEXT NOT NULL DEFAULT 'upcoming',
    notes       TEXT
);
CREATE INDEX idx_appt_patient ON appointments(patient_id);

-- ---------------------------------------------------------------------------
-- AI Clinical Safety (Module 5) — interaction reference + run results
-- ---------------------------------------------------------------------------
CREATE TABLE drug_interactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_a      TEXT NOT NULL,
    drug_b      TEXT NOT NULL,
    severity    severity_level NOT NULL,
    description TEXT,
    recommendation TEXT
);
CREATE UNIQUE INDEX idx_interaction_pair ON drug_interactions(lower(drug_a), lower(drug_b));

CREATE TABLE safety_checks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    input         JSONB NOT NULL,
    risk_score    SMALLINT NOT NULL,
    findings      JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Health timeline (Module 6)
-- ---------------------------------------------------------------------------
CREATE TABLE timeline_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date   DATE NOT NULL,
    type         TEXT NOT NULL,                     -- diagnosis|medication|improvement|procedure|lab
    title        TEXT NOT NULL,
    description  TEXT,
    ai_generated BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_timeline_patient ON timeline_events(patient_id);

-- ---------------------------------------------------------------------------
-- Voice assistant (Module 9)
-- ---------------------------------------------------------------------------
CREATE TABLE call_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        call_type NOT NULL,
    to_number   TEXT NOT NULL,
    provider_id TEXT,                               -- Twilio/Vapi call SID
    outcome     TEXT,                               -- answered|voicemail|no_answer
    duration_s  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_call_patient ON call_logs(patient_id);

-- ---------------------------------------------------------------------------
-- Guardian recovery (Module 12)
-- ---------------------------------------------------------------------------
CREATE TABLE guardians (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    relation    TEXT,
    email       CITEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',    -- pending|active
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guardian_patient ON guardians(patient_id);

CREATE TABLE recovery_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    threshold     SMALLINT NOT NULL DEFAULT 2,
    approvals     JSONB NOT NULL DEFAULT '[]',      -- array of guardian ids
    status        TEXT NOT NULL DEFAULT 'pending',  -- pending|completed|expired
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Security: audit log (every sensitive access is recorded)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    resource    TEXT,
    resource_id UUID,
    severity    severity_level DEFAULT 'low',
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor   ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
