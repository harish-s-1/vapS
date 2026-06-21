import { NextResponse } from "next/server";
import { getLog } from "@/server/agents/alerts-store";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";

// GET /api/safety/log?patient=  → recent agent decision log (audit trail)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  const data = await getLog(patient);
  return NextResponse.json({ data });
}
