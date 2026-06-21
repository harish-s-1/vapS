import { NextResponse } from "next/server";
import { listMedications } from "@/server/medications-store";

export const dynamic = "force-dynamic";

// GET /api/medications?patient=Name  → list medications with live-computed adherence
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? undefined;
  const data = await listMedications(patient);
  return NextResponse.json({ data });
}
