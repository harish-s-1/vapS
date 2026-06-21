import { NextResponse } from "next/server";
import { updateAppointment, type ApptStatus } from "@/server/appointments-store";

export const dynamic = "force-dynamic";

const STATUSES: ApptStatus[] = ["upcoming", "completed", "cancelled"];

// PATCH /api/appointments/:id  body { status?, date?, time? }  → cancel / complete / reschedule
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { status?: ApptStatus; date?: string; time?: string };
  if (b.status && !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: `status must be one of ${STATUSES.join(", ")}` }, { status: 422 });
  }
  const data = await updateAppointment(id, { status: b.status, date: b.date, time: b.time });
  if (!data) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json({ data });
}
