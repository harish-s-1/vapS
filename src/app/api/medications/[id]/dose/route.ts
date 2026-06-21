import { NextResponse } from "next/server";
import { logDose, type DoseStatus } from "@/server/medications-store";

export const dynamic = "force-dynamic";

const VALID: DoseStatus[] = ["taken", "missed", "skipped"];

// POST /api/medications/:id/dose  body { status }  → log a dose, recompute adherence
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const status = (body as { status?: DoseStatus }).status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${VALID.join(", ")}` }, { status: 422 });
  }
  const data = await logDose(id, status);
  if (!data) return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  return NextResponse.json({ data });
}
