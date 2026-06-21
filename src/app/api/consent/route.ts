import { NextResponse } from "next/server";
import { createConsent, listConsent } from "@/server/consent-store";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/consent?patient=Name | ?requester=Name  → list consent requests
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? undefined;
  const requester = searchParams.get("requester") ?? undefined;
  const data = await listConsent({ patient, requester });
  return NextResponse.json({ data });
}

// POST /api/consent  → requester (doctor/pharmacy) asks a patient for access
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { patient?: string; requester?: string; requesterRole?: Role; scope?: string };
  if (!b.patient || !b.requester || !b.scope) {
    return NextResponse.json({ error: "patient, requester and scope are required" }, { status: 422 });
  }
  const data = await createConsent({
    patient: b.patient,
    requester: b.requester,
    requesterRole: b.requesterRole ?? "doctor",
    scope: b.scope,
  });
  return NextResponse.json({ data }, { status: 201 });
}
