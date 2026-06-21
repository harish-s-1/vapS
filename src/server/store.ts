/**
 * Server-side persistent store for the Prescriptions module.
 *
 * Uses a JSON file on disk (.data/prescriptions.json) so prescriptions issued by
 * a doctor survive across requests and server restarts — a real persistence layer,
 * not in-memory mock state. In production this is replaced by the PostgreSQL/Supabase
 * schema in database/schema.sql (see backend/app/routers/prescriptions.py).
 *
 * NOTE: import only from server code (Route Handlers) — it uses node:fs.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prescriptions as seed } from "@/lib/mock-data";
import type { Prescription } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "prescriptions.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

async function readAll(): Promise<Prescription[]> {
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, "utf8");
  try {
    return JSON.parse(raw) as Prescription[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Prescription[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export function generateCode(): string {
  // VTX-RX-XXXXXXXX (8 hex chars), uppercase
  return "VTX-RX-" + randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function listPrescriptions(patient?: string): Promise<Prescription[]> {
  const rows = await readAll();
  const filtered = patient
    ? rows.filter((r) => r.patient.toLowerCase() === patient.toLowerCase())
    : rows;
  return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function findByCode(code: string): Promise<Prescription | undefined> {
  const rows = await readAll();
  return rows.find((r) => r.code.toLowerCase() === code.trim().toLowerCase());
}

export interface CreateInput {
  patient: string;
  doctor: string;
  medicines: Prescription["medicines"];
}

export async function createPrescription(input: CreateInput): Promise<Prescription> {
  const rows = await readAll();
  const code = generateCode();
  const rx: Prescription = {
    id: randomUUID(),
    code,
    patient: input.patient,
    doctor: input.doctor,
    date: new Date().toISOString(),
    status: "active",
    signatureValid: true,
    medicines: input.medicines,
  };
  rows.unshift(rx);
  await writeAll(rows);
  return rx;
}
