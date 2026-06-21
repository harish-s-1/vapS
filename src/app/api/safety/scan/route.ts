import { NextResponse } from "next/server";
import { runSafetyPipeline } from "@/server/agents/engine";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";

// POST /api/safety/scan  body { patient?, allergies?, trigger? }
// Runs the full agent pipeline and returns the SafetyReport.
export async function POST(req: Request) {
  let body: { patient?: string; allergies?: string[]; trigger?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* body optional */
  }
  const report = await runSafetyPipeline(body.patient || DEFAULT_PATIENT, {
    allergies: Array.isArray(body.allergies) ? body.allergies : undefined,
    trigger: body.trigger || "manual_scan",
  });
  return NextResponse.json({ data: report });
}
