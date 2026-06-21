/**
 * Server-side persistent store for the Digital Consent module (Module 2).
 *
 * File-backed (.data/consent.json). Implements the full workflow:
 *   doctor/pharmacy requests access → patient approves/rejects → access auto-expires.
 *
 * Auto-expiry runs on every read: any approved grant whose expiresAt has passed is
 * transitioned to "expired" and persisted, so expiry is enforced without a cron job.
 *
 * NOTE: server-only — uses node:fs. Production target: consent_requests table in
 * database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { consentRequests as seed } from "@/lib/mock-data";
import type { ConsentRequest, Role } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "consent.json");

const GRANT_DAYS = 7;

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

async function readRaw(): Promise<ConsentRequest[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as ConsentRequest[];
  } catch {
    return [];
  }
}

async function writeAll(rows: ConsentRequest[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

/** Apply auto-expiry; returns rows and whether anything changed. */
function applyExpiry(rows: ConsentRequest[]): { rows: ConsentRequest[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const out = rows.map((r) => {
    if (r.status === "approved" && r.expiresAt && +new Date(r.expiresAt) < now) {
      changed = true;
      return { ...r, status: "expired" as const };
    }
    return r;
  });
  return { rows: out, changed };
}

async function readAll(): Promise<ConsentRequest[]> {
  const { rows, changed } = applyExpiry(await readRaw());
  if (changed) await writeAll(rows);
  return rows;
}

export interface ConsentFilter {
  patient?: string;
  requester?: string;
}

export async function listConsent(filter: ConsentFilter = {}): Promise<ConsentRequest[]> {
  const rows = await readAll();
  return rows
    .filter((r) => (!filter.patient || r.patient.toLowerCase() === filter.patient.toLowerCase()))
    .filter((r) => (!filter.requester || r.requester.toLowerCase() === filter.requester.toLowerCase()))
    .sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt));
}

export interface CreateConsentInput {
  patient: string;
  requester: string;
  requesterRole: Role;
  scope: string;
}

export async function createConsent(input: CreateConsentInput): Promise<ConsentRequest> {
  const rows = await readRaw();
  const req: ConsentRequest = {
    id: randomUUID(),
    patient: input.patient,
    requester: input.requester,
    requesterRole: input.requesterRole,
    scope: input.scope,
    requestedAt: new Date().toISOString(),
    status: "pending",
  };
  rows.unshift(req);
  await writeAll(rows);
  return req;
}

export type Decision = "approved" | "rejected" | "revoked";

export async function decideConsent(id: string, decision: Decision): Promise<ConsentRequest | null> {
  const rows = await readRaw();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const current = rows[idx];
  const updated: ConsentRequest = {
    ...current,
    status: decision,
    expiresAt:
      decision === "approved"
        ? new Date(Date.now() + GRANT_DAYS * 864e5).toISOString()
        : decision === "revoked" || decision === "rejected"
          ? undefined
          : current.expiresAt,
  };
  rows[idx] = updated;
  await writeAll(rows);
  return updated;
}
