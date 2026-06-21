import { NextResponse } from "next/server";
import { createVault, listVault } from "@/server/vault-store";
import type { VaultCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES: VaultCategory[] = ["Prescription", "Lab Report", "Scan", "Allergy", "Chronic Condition", "Report"];

// GET /api/vault?patient=&category=&q=  → list records (server-side search + filter)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await listVault({
    patient: searchParams.get("patient") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ data });
}

function pickCategory(c?: string): VaultCategory {
  return c && (CATEGORIES as string[]).includes(c) ? (c as VaultCategory) : "Report";
}

// POST /api/vault  → upload a new record. Accepts multipart/form-data (with the actual
// file) or JSON (metadata only).
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const patient = String(form.get("patient") || "");
    const title = String(form.get("title") || "").trim();
    if (!patient || !title) {
      return NextResponse.json({ error: "patient and title are required" }, { status: 422 });
    }
    const file = form.get("file");
    let filePayload: { buffer: Buffer; mime: string; name: string } | undefined;
    if (file && file instanceof File && file.size > 0) {
      filePayload = { buffer: Buffer.from(await file.arrayBuffer()), mime: file.type, name: file.name };
    }
    const data = await createVault({
      patient,
      title,
      category: pickCategory(form.get("category")?.toString()),
      provider: form.get("provider")?.toString().trim(),
      tags: form.get("tags") ? String(form.get("tags")).split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      file: filePayload,
    });
    return NextResponse.json({ data }, { status: 201 });
  }

  // JSON fallback (metadata only)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { patient?: string; title?: string; category?: VaultCategory; provider?: string; size?: string; tags?: string[] };
  if (!b.patient || !b.title?.trim()) {
    return NextResponse.json({ error: "patient and title are required" }, { status: 422 });
  }
  const data = await createVault({
    patient: b.patient,
    title: b.title.trim(),
    category: pickCategory(b.category),
    provider: b.provider?.trim(),
    size: b.size,
    tags: b.tags,
  });
  return NextResponse.json({ data }, { status: 201 });
}
