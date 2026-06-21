import { NextResponse } from "next/server";
import { summary } from "@/server/medications-store";

export const dynamic = "force-dynamic";

// GET /api/medications/summary?patient=Name  → aggregated adherence (feeds dashboard donut)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? undefined;
  return NextResponse.json({ data: await summary(patient) });
}
