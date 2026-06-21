import { NextResponse } from "next/server";
import { recoveryAction, type RecoveryAction } from "@/server/guardians-store";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";
const ACTIONS: RecoveryAction[] = ["approve", "reset"];

// POST /api/guardians/recovery  body { action, guardianId?, patient? }  → run the recovery state machine
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { action?: RecoveryAction; guardianId?: string; patient?: string };
  if (!b.action || !ACTIONS.includes(b.action)) {
    return NextResponse.json({ error: `action must be one of ${ACTIONS.join(", ")}` }, { status: 422 });
  }
  const data = await recoveryAction(b.patient || DEFAULT_PATIENT, b.action, b.guardianId);
  return NextResponse.json({ data });
}
