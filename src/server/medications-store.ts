/**
 * Server-side persistent store for the Medications module (Module 7).
 *
 * File-backed (.data/medications.json). Tracks per-medication dose counters
 * (taken / missed / skipped); adherence is *computed* from those counters, and the
 * patient-level summary aggregates them — so logging a dose immediately moves the
 * real adherence score shown on the Medications page and the dashboard donut.
 *
 * NOTE: server-only. Production target: medications + dose_events tables in
 * database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { medications as seed } from "@/lib/mock-data";
import type { Medication } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "medications.json");
const DEFAULT_PATIENT = "Ananya Sharma";

export type DoseStatus = "taken" | "missed" | "skipped";

interface StoredMed extends Medication {
  patient: string;
  taken: number;
  missed: number;
  skipped: number;
}

/**
 * Seed counters from each med's baseline adherence over a recent ~20-dose window,
 * so the score is realistic on day one yet responsive — logging a single dose
 * visibly moves the computed adherence.
 */
const WINDOW = 20;
function seedCounters(adherence: number): { taken: number; missed: number; skipped: number } {
  const taken = Math.max(1, Math.round((adherence / 100) * WINDOW));
  const remainder = Math.max(0, WINDOW - taken);
  const missed = Math.round(remainder * 0.7);
  const skipped = remainder - missed;
  return { taken, missed, skipped };
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const seeded: StoredMed[] = seed.map((m) => ({ ...m, patient: DEFAULT_PATIENT, ...seedCounters(m.adherence) }));
    await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  }
}

async function readAll(): Promise<StoredMed[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as StoredMed[];
  } catch {
    return [];
  }
}

async function writeAll(rows: StoredMed[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

function adherenceOf(m: StoredMed): number {
  const total = m.taken + m.missed + m.skipped;
  return total === 0 ? 0 : Math.round((m.taken / total) * 100);
}

function toMedication(m: StoredMed): Medication {
  return {
    id: m.id, name: m.name, dosage: m.dosage, frequency: m.frequency, time: m.time,
    status: m.status, nextDose: m.nextDose, adherence: adherenceOf(m),
  };
}

export async function listMedications(patient = DEFAULT_PATIENT): Promise<Medication[]> {
  const rows = await readAll();
  return rows.filter((m) => m.patient.toLowerCase() === patient.toLowerCase()).map(toMedication);
}

export async function logDose(id: string, status: DoseStatus): Promise<Medication | null> {
  const rows = await readAll();
  const idx = rows.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  rows[idx][status] += 1;
  await writeAll(rows);
  return toMedication(rows[idx]);
}

export interface AdherenceSummary {
  taken: number;
  missed: number;
  skipped: number;
  adherence: number;
  activeCount: number;
}

export async function summary(patient = DEFAULT_PATIENT): Promise<AdherenceSummary> {
  const rows = (await readAll()).filter((m) => m.patient.toLowerCase() === patient.toLowerCase());
  const t = rows.reduce((s, m) => s + m.taken, 0);
  const mi = rows.reduce((s, m) => s + m.missed, 0);
  const sk = rows.reduce((s, m) => s + m.skipped, 0);
  const total = t + mi + sk || 1;
  return {
    taken: Math.round((t / total) * 100),
    missed: Math.round((mi / total) * 100),
    skipped: Math.round((sk / total) * 100),
    adherence: Math.round((t / total) * 100),
    activeCount: rows.filter((m) => m.status === "active").length,
  };
}
