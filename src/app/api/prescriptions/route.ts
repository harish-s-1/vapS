import { NextResponse } from "next/server";
import { createPrescription, listPrescriptions } from "@/server/store";
import { runSafetyPipeline } from "@/server/agents/engine";

export const dynamic = "force-dynamic";

// GET /api/prescriptions?patient=Name  → list prescriptions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient") ?? undefined;
  const data = await listPrescriptions(patient);
  return NextResponse.json({ data });
}

// POST /api/prescriptions  → issue a new prescription
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as {
    patient?: string;
    doctor?: string;
    medicines?: { name?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[];
  };

  if (!b.patient || !b.doctor) {
    return NextResponse.json({ error: "patient and doctor are required" }, { status: 422 });
  }
  const medicines = (b.medicines ?? []).filter((m) => m.name && m.name.trim());
  if (medicines.length === 0) {
    return NextResponse.json({ error: "At least one medicine is required" }, { status: 422 });
  }

  const rx = await createPrescription({
    patient: b.patient,
    doctor: b.doctor,
    medicines: medicines.map((m) => ({
      name: m.name!.trim(),
      dosage: m.dosage?.trim() || "—",
      frequency: m.frequency?.trim() || "As directed",
      duration: m.duration?.trim() || "—",
      instructions: m.instructions?.trim() || undefined,
    })),
  });

  // Autonomous AI safety agents run on every prescription upload (fraud → allergy
  // → mixing → dosage). Failures here must never block prescription creation.
  try {
    await runSafetyPipeline(b.patient, { trigger: "prescription_uploaded" });
  } catch {
    /* safety scan is best-effort; surfaced separately via /api/safety */
  }

  return NextResponse.json({ data: rx }, { status: 201 });
}
