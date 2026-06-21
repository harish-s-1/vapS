import { getVaultFile } from "@/server/vault-store";

export const dynamic = "force-dynamic";

// GET /api/vault/:id/file  → stream the stored document inline (for viewing)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await getVaultFile(id);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "no-store",
    },
  });
}
