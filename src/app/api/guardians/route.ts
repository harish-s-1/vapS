import { NextResponse } from "next/server";
import { addGuardian, getState } from "@/server/guardians-store";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";

// GET /api/guardians?patient=  → { guardians, recovery }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  return NextResponse.json({ data: await getState(patient) });
}

// POST /api/guardians  → add a guardian
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { patient?: string; name?: string; relation?: string; email?: string };
  if (!b.name?.trim() || !b.email?.trim()) {
    return NextResponse.json({ error: "name and email are required" }, { status: 422 });
  }
  const data = await addGuardian(b.patient || DEFAULT_PATIENT, {
    name: b.name.trim(),
    relation: b.relation?.trim() || "Guardian",
    email: b.email.trim(),
  });
  return NextResponse.json({ data }, { status: 201 });
}
