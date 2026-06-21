/**
 * Server-side persistent store for the Guardian Recovery module (Module 12).
 *
 * File-backed (.data/guardians.json). Manages a patient's trusted guardians and a
 * threshold-approval recovery state machine: approvals accumulate until they reach
 * the threshold, at which point recovery is marked complete. Only "active" guardians
 * can approve.
 *
 * NOTE: server-only. Production target: guardians + recovery_requests tables in
 * database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { guardians as seed } from "@/lib/mock-data";
import type { Guardian, RecoveryState } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "guardians.json");
const DEFAULT_PATIENT = "Ananya Sharma";
const THRESHOLD = 2;

interface DB {
  guardians: Guardian[];
  recovery: Record<string, RecoveryState>;
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const db: DB = {
      guardians: seed.map((g) => ({ ...g, patient: g.patient ?? DEFAULT_PATIENT })),
      recovery: { [DEFAULT_PATIENT]: { threshold: THRESHOLD, approvals: [], status: "pending" } },
    };
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  }
}

async function read(): Promise<DB> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DB;
  } catch {
    return { guardians: [], recovery: {} };
  }
}

async function write(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function recoveryFor(db: DB, patient: string): RecoveryState {
  return db.recovery[patient] ?? { threshold: THRESHOLD, approvals: [], status: "pending" };
}

export interface GuardianState {
  guardians: Guardian[];
  recovery: RecoveryState;
}

export async function getState(patient = DEFAULT_PATIENT): Promise<GuardianState> {
  const db = await read();
  const guardians = db.guardians.filter((g) => (g.patient ?? DEFAULT_PATIENT).toLowerCase() === patient.toLowerCase());
  return { guardians, recovery: recoveryFor(db, patient) };
}

export async function addGuardian(
  patient: string,
  input: { name: string; relation: string; email: string }
): Promise<Guardian> {
  const db = await read();
  const g: Guardian = {
    id: randomUUID(),
    patient,
    name: input.name,
    relation: input.relation,
    email: input.email,
    status: "active",
  };
  db.guardians.push(g);
  await write(db);
  return g;
}

export async function removeGuardian(patient: string, id: string): Promise<boolean> {
  const db = await read();
  const before = db.guardians.length;
  db.guardians = db.guardians.filter((g) => g.id !== id);
  if (db.guardians.length === before) return false;
  const rec = recoveryFor(db, patient);
  rec.approvals = rec.approvals.filter((a) => a !== id);
  rec.status = rec.approvals.length >= rec.threshold ? "completed" : "pending";
  db.recovery[patient] = rec;
  await write(db);
  return true;
}

export type RecoveryAction = "approve" | "reset";

export async function recoveryAction(
  patient: string,
  action: RecoveryAction,
  guardianId?: string
): Promise<RecoveryState> {
  const db = await read();
  const rec = recoveryFor(db, patient);

  if (action === "reset") {
    rec.approvals = [];
    rec.status = "pending";
  } else if (action === "approve" && guardianId) {
    const guardian = db.guardians.find((g) => g.id === guardianId && g.status === "active");
    if (guardian) {
      // toggle approval
      rec.approvals = rec.approvals.includes(guardianId)
        ? rec.approvals.filter((a) => a !== guardianId)
        : [...rec.approvals, guardianId];
      rec.status = rec.approvals.length >= rec.threshold ? "completed" : "pending";
    }
  }

  db.recovery[patient] = rec;
  await write(db);
  return rec;
}
