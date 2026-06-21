import { NextResponse } from "next/server";
import { listReminders, sendReminder, twilioConfigured } from "@/server/voice-store";
import type { ReminderType } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";
const TYPES: ReminderType[] = ["Medication", "Appointment", "Follow-up"];

// GET /api/voice?patient=  → { reminders, twilioConfigured }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  const reminders = await listReminders(patient);
  return NextResponse.json({ data: { reminders, twilioConfigured } });
}

// POST /api/voice  → send/schedule an SMS reminder via Twilio
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as {
    patient?: string; type?: ReminderType; to?: string; date?: string; time?: string; message?: string;
  };

  if (!b.to?.trim()) {
    return NextResponse.json({ error: "A phone number (To) is required" }, { status: 422 });
  }
  // E.164-ish validation: +<country><number>
  if (!/^\+?[1-9]\d{6,14}$/.test(b.to.replace(/[\s-]/g, ""))) {
    return NextResponse.json({ error: "Enter a valid phone number in international format, e.g. +919876543210" }, { status: 422 });
  }
  if (!b.date || !b.time) {
    return NextResponse.json({ error: "Both a date and a time are required" }, { status: 422 });
  }

  const type: ReminderType = b.type && TYPES.includes(b.type) ? b.type : "Medication";
  const scheduledFor = new Date(`${b.date}T${b.time}`);
  const whenLabel = isNaN(+scheduledFor)
    ? `${b.date} ${b.time}`
    : scheduledFor.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const data = await sendReminder({
    patient: b.patient || DEFAULT_PATIENT,
    type,
    to: b.to.replace(/[\s-]/g, ""),
    scheduledFor: isNaN(+scheduledFor) ? undefined : scheduledFor.toISOString(),
    whenLabel,
    message: b.message,
  });
  return NextResponse.json({ data }, { status: 201 });
}
