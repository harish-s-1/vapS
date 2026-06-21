import { NextResponse } from "next/server";
import { deleteVault } from "@/server/vault-store";

export const dynamic = "force-dynamic";

// DELETE /api/vault/:id  → remove a record
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteVault(id);
  if (!ok) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
