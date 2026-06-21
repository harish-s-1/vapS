/**
 * Server-side store + Twilio integration for the Voice/Reminder module (Module 9).
 *
 * File-backed (.data/voice-log.json). Sends an SMS reminder via the Twilio REST API
 * when credentials are configured; otherwise records a "Simulated" reminder so the
 * flow works without setup. If a Messaging Service SID is configured and the reminder
 * is 15min–7days out, the message is scheduled with Twilio; otherwise it sends now.
 *
 * Env (server-side, no NEXT_PUBLIC_):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER,
 *   TWILIO_MESSAGING_SERVICE_SID (optional, enables scheduling)
 *
 * NOTE: server-only. Production target: call_logs table in database/schema.sql.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ReminderStatus, ReminderType, VoiceReminder } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "voice-log.json");
const DEFAULT_PATIENT = "Ananya Sharma";

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM_NUMBER;
const MSG_SERVICE = process.env.TWILIO_MESSAGING_SERVICE_SID;

export const twilioConfigured = Boolean(SID && TOKEN && (FROM || MSG_SERVICE));

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

async function readAll(): Promise<VoiceReminder[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as VoiceReminder[];
  } catch {
    return [];
  }
}

async function writeAll(rows: VoiceReminder[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listReminders(patient = DEFAULT_PATIENT): Promise<VoiceReminder[]> {
  const rows = await readAll();
  return rows
    .filter((r) => (r.patient ?? DEFAULT_PATIENT).toLowerCase() === patient.toLowerCase())
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function composeMessage(type: ReminderType, whenLabel: string, custom?: string): string {
  if (custom?.trim()) return custom.trim();
  const base: Record<ReminderType, string> = {
    Medication: `patS reminder: It's time to take your medication`,
    Appointment: `patS reminder: You have an upcoming appointment`,
    "Follow-up": `patS reminder: A follow-up is due`,
  };
  return `${base[type]} on ${whenLabel}. Reply STOP to opt out.`;
}

interface TwilioResult {
  status: ReminderStatus;
  providerId?: string;
  error?: string;
}

async function sendViaTwilio(to: string, body: string, sendAtISO?: string): Promise<TwilioResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const params = new URLSearchParams({ To: to, Body: body });

  // Schedule when a Messaging Service + a valid future time are available.
  let scheduled = false;
  if (sendAtISO && MSG_SERVICE) {
    const at = +new Date(sendAtISO);
    const minutes = (at - Date.now()) / 60000;
    if (minutes >= 15 && minutes <= 7 * 24 * 60) {
      params.set("MessagingServiceSid", MSG_SERVICE);
      params.set("ScheduleType", "fixed");
      params.set("SendAt", new Date(sendAtISO).toISOString());
      scheduled = true;
    }
  }
  if (!scheduled) {
    if (MSG_SERVICE) params.set("MessagingServiceSid", MSG_SERVICE);
    else params.set("From", FROM as string);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const data = (await res.json()) as { sid?: string; status?: string; message?: string; error_message?: string };
    if (!res.ok) {
      return { status: "Failed", error: data.error_message || data.message || `Twilio error ${res.status}` };
    }
    return { status: scheduled ? "Scheduled" : "Sent", providerId: data.sid };
  } catch (e) {
    return { status: "Failed", error: e instanceof Error ? e.message : "Network error contacting Twilio" };
  }
}

export interface SendReminderInput {
  patient: string;
  type: ReminderType;
  to: string;
  scheduledFor?: string; // ISO
  whenLabel: string; // human-readable date/time for the message body
  message?: string;
}

export async function sendReminder(input: SendReminderInput): Promise<VoiceReminder> {
  const body = composeMessage(input.type, input.whenLabel, input.message);

  let result: TwilioResult;
  if (twilioConfigured) {
    result = await sendViaTwilio(input.to, body, input.scheduledFor);
  } else {
    // Demo mode — no Twilio credentials configured.
    result = { status: "Simulated" };
  }

  const entry: VoiceReminder = {
    id: randomUUID(),
    patient: input.patient,
    type: input.type,
    to: input.to,
    message: body,
    status: result.status,
    scheduledFor: input.scheduledFor,
    providerId: result.providerId,
    error: result.error,
    date: new Date().toISOString(),
  };

  const rows = await readAll();
  rows.unshift(entry);
  await writeAll(rows);
  return entry;
}
