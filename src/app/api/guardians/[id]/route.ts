import { NextResponse } from "next/server";
import { removeGuardian } from "@/server/guardians-store";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";

// DELETE /api/guardians/:id?patient=  → remove a guardian (and clear their approval)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  const ok = await removeGuardian(patient, id);
  if (!ok) return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
