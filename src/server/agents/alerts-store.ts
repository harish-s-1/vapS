/**
 * Persistence for the AI Safety system: the latest report per patient plus an
 * append-only decision log (every agent decision is recorded for audit).
 *
 * File-backed (.data/safety-alerts.json, .data/safety-log.json). Production target:
 * safety_checks + audit_log tables in database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DecisionLogEntry, SafetyReport } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const REPORT_FILE = path.join(DATA_DIR, "safety-alerts.json");
const LOG_FILE = path.join(DATA_DIR, "safety-log.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function saveReport(report: SafetyReport): Promise<void> {
  const all = await readJson<Record<string, SafetyReport>>(REPORT_FILE, {});
  all[report.patient.toLowerCase()] = report;
  await writeJson(REPORT_FILE, all);
}

export async function getReport(patient: string): Promise<SafetyReport | null> {
  const all = await readJson<Record<string, SafetyReport>>(REPORT_FILE, {});
  return all[patient.toLowerCase()] ?? null;
}

export async function appendLog(entries: DecisionLogEntry[]): Promise<void> {
  if (!entries.length) return;
  const log = await readJson<DecisionLogEntry[]>(LOG_FILE, []);
  log.push(...entries);
  // keep the log bounded
  const trimmed = log.slice(-500);
  await writeJson(LOG_FILE, trimmed);
}

export async function getLog(patient: string, limit = 50): Promise<DecisionLogEntry[]> {
  const log = await readJson<DecisionLogEntry[]>(LOG_FILE, []);
  return log
    .filter((e) => e.patient.toLowerCase() === patient.toLowerCase())
    .slice(-limit)
    .reverse();
}
