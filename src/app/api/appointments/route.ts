import { NextResponse } from "next/server";
import { createAppointment, listAppointments } from "@/server/appointments-store";
import type { AppointmentType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPES: AppointmentType[] = ["In-person", "Video", "Lab Test", "Follow-up"];

// GET /api/appointments?patient=&status=  → list
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await listAppointments({
    patient: searchParams.get("patient") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return NextResponse.json({ data });
}

// POST /api/appointments  → book a new appointment
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as {
    patient?: string; doctor?: string; specialty?: string; date?: string; time?: string; type?: AppointmentType;
  };
  if (!b.patient || !b.doctor?.trim() || !b.date || !b.time) {
    return NextResponse.json({ error: "patient, doctor, date and time are required" }, { status: 422 });
  }
  const data = await createAppointment({
    patient: b.patient,
    doctor: b.doctor.trim(),
    specialty: b.specialty?.trim() || "General Medicine",
    date: b.date,
    time: b.time,
    type: b.type && TYPES.includes(b.type) ? b.type : "In-person",
  });
  return NextResponse.json({ data }, { status: 201 });
}
