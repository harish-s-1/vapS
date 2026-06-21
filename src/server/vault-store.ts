/**
 * Server-side persistent store for the Health Vault module (Module 1).
 *
 * File-backed (.data/vault.json). Supports create (upload metadata), list with
 * server-side search + category filtering, and delete. Records are scoped per patient.
 *
 * NOTE: server-only — uses node:fs. Production target: vault_records table in
 * database/schema.sql (file bytes live in Supabase Storage; this stores metadata).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { vaultRecords as seed } from "@/lib/mock-data";
import type { VaultCategory, VaultRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "vault.json");
const FILES_DIR = path.join(DATA_DIR, "vault-files");
const DEFAULT_PATIENT = "Ananya Sharma";

function blobPath(id: string): string {
  return path.join(FILES_DIR, id);
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // seed records belong to the demo patient
    const seeded = seed.map((r) => ({ ...r, patient: r.patient ?? DEFAULT_PATIENT }));
    await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  }
}

async function readAll(): Promise<VaultRecord[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as VaultRecord[];
  } catch {
    return [];
  }
}

async function writeAll(rows: VaultRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export interface VaultFilter {
  patient?: string;
  category?: string; // "All" or a VaultCategory
  q?: string;
}

export async function listVault(filter: VaultFilter = {}): Promise<VaultRecord[]> {
  const rows = await readAll();
  const q = (filter.q ?? "").trim().toLowerCase();
  return rows
    .filter((r) => !filter.patient || (r.patient ?? DEFAULT_PATIENT).toLowerCase() === filter.patient.toLowerCase())
    .filter((r) => !filter.category || filter.category === "All" || r.category === filter.category)
    .filter((r) => !q || `${r.title} ${r.provider} ${(r.tags ?? []).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export interface CreateVaultInput {
  patient: string;
  title: string;
  category: VaultCategory;
  provider?: string;
  size?: string;
  tags?: string[];
  file?: { buffer: Buffer; mime: string; name: string };
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function createVault(input: CreateVaultInput): Promise<VaultRecord> {
  const rows = await readAll();
  const id = randomUUID();

  // Persist the uploaded bytes to disk so the document can be viewed later.
  let fileMeta: Pick<VaultRecord, "hasFile" | "mime" | "fileName" | "size"> = { size: input.size };
  if (input.file && input.file.buffer.length > 0) {
    await fs.mkdir(FILES_DIR, { recursive: true });
    await fs.writeFile(blobPath(id), input.file.buffer);
    fileMeta = {
      hasFile: true,
      mime: input.file.mime || "application/octet-stream",
      fileName: input.file.name,
      size: input.size || humanSize(input.file.buffer.length),
    };
  }

  const rec: VaultRecord = {
    id,
    patient: input.patient,
    title: input.title,
    category: input.category,
    provider: input.provider || "Self-uploaded",
    date: new Date().toISOString(),
    tags: input.tags && input.tags.length ? input.tags : ["New"],
    ...fileMeta,
  };
  rows.unshift(rec);
  await writeAll(rows);
  return rec;
}

export interface VaultFile {
  buffer: Buffer;
  mime: string;
  fileName: string;
}

export async function getVaultFile(id: string): Promise<VaultFile | null> {
  const rows = await readAll();
  const rec = rows.find((r) => r.id === id);
  if (!rec || !rec.hasFile) return null;
  try {
    const buffer = await fs.readFile(blobPath(id));
    return { buffer, mime: rec.mime || "application/octet-stream", fileName: rec.fileName || rec.title };
  } catch {
    return null;
  }
}

export async function deleteVault(id: string): Promise<boolean> {
  const rows = await readAll();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(next);
  await fs.rm(blobPath(id), { force: true }).catch(() => {});
  return true;
}
