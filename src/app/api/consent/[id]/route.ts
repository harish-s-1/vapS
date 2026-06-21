import { NextResponse } from "next/server";
import { decideConsent, type Decision } from "@/server/consent-store";

export const dynamic = "force-dynamic";

const VALID: Decision[] = ["approved", "rejected", "revoked"];

// PATCH /api/consent/:id  body { decision }  → patient approves/rejects/revokes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const decision = (body as { decision?: Decision }).decision;
  if (!decision || !VALID.includes(decision)) {
    return NextResponse.json({ error: `decision must be one of ${VALID.join(", ")}` }, { status: 422 });
  }
  const data = await decideConsent(id, decision);
  if (!data) return NextResponse.json({ error: "Consent request not found" }, { status: 404 });
  return NextResponse.json({ data });
}
