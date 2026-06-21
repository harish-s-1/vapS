import { NextResponse } from "next/server";
import { getReport } from "@/server/agents/alerts-store";
import { runSafetyPipeline } from "@/server/agents/engine";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = "Ananya Sharma";

// GET /api/safety/report?patient=  → latest persisted report (runs fresh if none yet)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? DEFAULT_PATIENT;
  const existing = await getReport(patient);
  const report = existing ?? (await runSafetyPipeline(patient, { trigger: "first_view" }));
  return NextResponse.json({ data: report });
}
