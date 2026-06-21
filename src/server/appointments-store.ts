/**
 * Server-side persistent store for the Appointments module.
 *
 * File-backed (.data/appointments.json). Supports book (create), list (by patient,
 * optional status), and status changes (cancel / complete). The upcoming count feeds
 * the patient dashboard.
 *
 * NOTE: server-only. Production target: appointments table in database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appointments as seed } from "@/lib/mock-data";
import type { Appointment, AppointmentType } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "appointments.json");
const DEFAULT_PATIENT = "Ananya Sharma";

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const seeded = seed.map((a) => ({ ...a, patient: a.patient ?? DEFAULT_PATIENT }));
    await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  }
}

async function readAll(): Promise<Appointment[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Appointment[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Appointment[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export interface ApptFilter {
  patient?: string;
  status?: string;
}

export async function listAppointments(filter: ApptFilter = {}): Promise<Appointment[]> {
  const rows = await readAll();
  return rows
    .filter((a) => !filter.patient || (a.patient ?? DEFAULT_PATIENT).toLowerCase() === filter.patient.toLowerCase())
    .filter((a) => !filter.status || a.status === filter.status)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export interface CreateApptInput {
  patient: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: AppointmentType;
}

export async function createAppointment(input: CreateApptInput): Promise<Appointment> {
  const rows = await readAll();
  const appt: Appointment = {
    id: randomUUID(),
    patient: input.patient,
    doctor: input.doctor,
    specialty: input.specialty,
    date: input.date,
    time: input.time,
    type: input.type,
    status: "upcoming",
  };
  rows.push(appt);
  await writeAll(rows);
  return appt;
}

export type ApptStatus = "upcoming" | "completed" | "cancelled";

export async function updateAppointment(
  id: string,
  patch: { status?: ApptStatus; date?: string; time?: string }
): Promise<Appointment | null> {
  const rows = await readAll();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  // Only apply defined fields — spreading `undefined` would drop existing
  // keys (e.g. date/time) when the record is serialized back to JSON.
  const next = { ...rows[idx] };
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.date !== undefined) next.date = patch.date;
  if (patch.time !== undefined) next.time = patch.time;
  rows[idx] = next;
  await writeAll(rows);
  return next;
}

export async function upcomingCount(patient = DEFAULT_PATIENT): Promise<number> {
  const rows = await readAll();
  return rows.filter((a) => (a.patient ?? DEFAULT_PATIENT).toLowerCase() === patient.toLowerCase() && a.status === "upcoming").length;
}
