import { NextResponse } from "next/server";
import { findByCode } from "@/server/store";

export const dynamic = "force-dynamic";

// GET /api/prescriptions/verify/:code  → verify authenticity (public, like a QR scan)
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rx = await findByCode(code);

  if (!rx) {
    return NextResponse.json({ verified: false, reason: "Prescription not found in the network." });
  }
  if (!rx.signatureValid) {
    return NextResponse.json({ verified: false, reason: "Doctor signature could not be validated." });
  }
  if (rx.status === "expired") {
    return NextResponse.json({ verified: false, reason: "This prescription has expired." });
  }
  return NextResponse.json({ verified: true, prescription: rx });
}
