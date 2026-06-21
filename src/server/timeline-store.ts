/**
 * Server-side persistent store for the AI Health Timeline module (Module 6).
 *
 * File-backed (.data/timeline.json). Stores chronological health events and produces
 * a narrative summary. The summary here is generated deterministically from the event
 * data; in production this is the Gemini integration point (swap `generateSummary`
 * for a call to the Gemini API using GEMINI_API_KEY).
 *
 * NOTE: server-only. Production target: timeline_events table in database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { timelineEvents as seed } from "@/lib/mock-data";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "timeline.json");
const DEFAULT_PATIENT = "Ananya Sharma";

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const seeded = seed.map((e) => ({ ...e, patient: e.patient ?? DEFAULT_PATIENT }));
    await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  }
}

async function readAll(): Promise<TimelineEvent[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as TimelineEvent[];
  } catch {
    return [];
  }
}

async function writeAll(rows: TimelineEvent[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

function forPatient(rows: TimelineEvent[], patient: string): TimelineEvent[] {
  return rows
    .filter((e) => (e.patient ?? DEFAULT_PATIENT).toLowerCase() === patient.toLowerCase())
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

/**
 * Generate a narrative summary from the events. Deterministic stand-in for the
 * Gemini call — see module docstring.
 */
function generateSummary(events: TimelineEvent[]): string {
  if (events.length === 0) return "No health events recorded yet. Add your first event to begin building your timeline.";

  const byType = (t: TimelineEventType) => events.filter((e) => e.type === t);
  const diagnoses = byType("diagnosis");
  const meds = byType("medication");
  const improvements = byType("improvement");
  const first = events[0];
  const latest = events[events.length - 1];

  const parts: string[] = [];
  if (diagnoses.length) {
    const d = diagnoses[0];
    parts.push(`Since ${d.title.toLowerCase()} in ${d.year}, your record spans ${events.length} milestones.`);
  } else {
    parts.push(`Your timeline spans ${events.length} health events from ${first.year} to ${latest.year}.`);
  }
  if (meds.length) parts.push(`${meds.length} treatment change${meds.length > 1 ? "s have" : " has"} been logged.`);
  if (improvements.length) {
    parts.push(`The latest improvement — "${improvements[improvements.length - 1].title}" — points to a positive trajectory.`);
  } else {
    parts.push(`Most recent: "${latest.title}" (${latest.year}).`);
  }
  parts.push("Continue current treatment and keep your next review on schedule.");
  return parts.join(" ");
}

export interface TimelineResult {
  events: TimelineEvent[];
  summary: string;
}

export async function getTimeline(patient = DEFAULT_PATIENT): Promise<TimelineResult> {
  const events = forPatient(await readAll(), patient);
  return { events, summary: generateSummary(events) };
}

export interface CreateEventInput {
  patient: string;
  date: string;
  title: string;
  description: string;
  type: TimelineEventType;
}

export async function addEvent(input: CreateEventInput): Promise<TimelineEvent> {
  const rows = await readAll();
  const ev: TimelineEvent = {
    id: randomUUID(),
    patient: input.patient,
    year: new Date(input.date).getFullYear().toString(),
    date: input.date,
    title: input.title,
    description: input.description,
    type: input.type,
  };
  rows.push(ev);
  await writeAll(rows);
  return ev;
}
