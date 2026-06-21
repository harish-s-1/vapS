import { NextResponse } from "next/server";
import { addEvent, getTimeline } from "@/server/timeline-store";
import type { TimelineEventType } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";
const TYPES: TimelineEventType[] = ["diagnosis", "medication", "improvement", "procedure", "lab"];

// GET /api/timeline?patient=  → { events, summary }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  return NextResponse.json({ data: await getTimeline(patient) });
}

// POST /api/timeline  → add a health event (summary is regenerated on next GET)
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { patient?: string; date?: string; title?: string; description?: string; type?: TimelineEventType };
  if (!b.title?.trim() || !b.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 422 });
  }
  const data = await addEvent({
    patient: b.patient || DEFAULT_PATIENT,
    date: b.date,
    title: b.title.trim(),
    description: b.description?.trim() || "",
    type: b.type && TYPES.includes(b.type) ? b.type : "lab",
  });
  return NextResponse.json({ data }, { status: 201 });
}
