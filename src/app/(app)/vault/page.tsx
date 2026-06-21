"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Upload,
  FileText,
  FlaskConical,
  ScanLine,
  AlertTriangle,
  HeartPulse,
  Filter,
  Trash2,
  Loader2,
  X,
  Download,
  FileQuestion,
} from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, EmptyState } from "@/components/ui/primitives";
import { vaultApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import type { VaultCategory, VaultRecord } from "@/lib/types";

const categories = ["All", "Prescription", "Lab Report", "Scan", "Allergy", "Chronic Condition"] as const;
const uploadCategories: VaultCategory[] = ["Prescription", "Lab Report", "Scan", "Allergy", "Chronic Condition", "Report"];

const catIcon: Record<string, { icon: typeof FileText; tone: string }> = {
  Prescription: { icon: FileText, tone: "bg-primary-50 text-primary-600" },
  "Lab Report": { icon: FlaskConical, tone: "bg-blue-50 text-info" },
  Scan: { icon: ScanLine, tone: "bg-emerald-50 text-emerald" },
  Allergy: { icon: AlertTriangle, tone: "bg-amber-50 text-warning" },
  "Chronic Condition": { icon: HeartPulse, tone: "bg-red-50 text-danger" },
  Report: { icon: FileText, tone: "bg-primary-50 text-primary-600" },
};

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function VaultPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [q, setQ] = useState("");
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<VaultRecord | null>(null);

  // upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uTitle, setUTitle] = useState("");
  const [uCategory, setUCategory] = useState<VaultCategory>("Report");
  const [uProvider, setUProvider] = useState("");
  const [uSize, setUSize] = useState<string | undefined>();
  const [uFile, setUFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) =>
      vaultApi.list({ patient, category: cat, q }).then((rows) => {
        if (!signal?.aborted) setRecords(rows);
      }),
    [patient, cat, q]
  );

  // debounce search/filter changes
  const first = useRef(true);
  useEffect(() => {
    const ctrl = new AbortController();
    const delay = first.current ? 0 : 250;
    first.current = false;
    const t = setTimeout(() => load(ctrl.signal).finally(() => setLoading(false)), delay);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [load]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUFile(f);
    setUSize(humanSize(f.size));
    if (!uTitle) setUTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const submitUpload = async () => {
    if (!uTitle.trim()) return;
    setSaving(true);
    try {
      await vaultApi.create({ patient, title: uTitle, category: uCategory, provider: uProvider, size: uSize, file: uFile });
      setShowUpload(false);
      setUTitle(""); setUProvider(""); setUSize(undefined); setUCategory("Report"); setUFile(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await vaultApi.remove(id);
      await load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Health Vault"
        subtitle="Your prescriptions, reports, labs, scans, allergies & conditions — all in one secure place."
        action={
          <button onClick={() => setShowUpload((s) => !s)} className="btn-primary">
            <Upload className="h-4 w-4" /> Upload Record
          </button>
        }
      />

      {showUpload && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Upload a record</h3>
            <button onClick={() => setShowUpload(false)} className="text-ink-soft hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input value={uTitle} onChange={(e) => setUTitle(e.target.value)} placeholder="e.g. Thyroid Panel" className="input" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={uCategory} onChange={(e) => setUCategory(e.target.value as VaultCategory)} className="input">
                {uploadCategories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Provider</label>
              <input value={uProvider} onChange={(e) => setUProvider(e.target.value)} placeholder="e.g. City Diagnostics" className="input" />
            </div>
            <div>
              <label className="label">File {uSize && <span className="text-primary-600">· {uSize}</span>}</label>
              <input type="file" onChange={onFile} className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-xl file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={submitUpload} disabled={!uTitle.trim() || saving} className="btn-primary">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Save to Vault</>}
            </button>
            <button onClick={() => setShowUpload(false)} className="btn-soft">Cancel</button>
          </div>
        </Card>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records, providers…" className="input pl-11" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-ink-soft" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                cat === c ? "bg-primary-500 text-white shadow-card" : "bg-surface text-ink-soft hover:bg-bg-secondary"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
      ) : records.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No records found" hint="Try a different search or category, or upload a new record." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => {
            const cfg = catIcon[r.category] ?? catIcon.Report;
            const Icon = cfg.icon;
            return (
              <Card key={r.id} onClick={() => setViewing(r)} className="group cursor-pointer p-5" role="button" title="Click to view">
                <div className="flex items-start gap-3">
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", cfg.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-ink">{r.title}</h3>
                    <p className="truncate text-xs text-ink-soft">{r.provider}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                    disabled={deleting === r.id}
                    title="Delete record"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink-soft opacity-0 transition hover:bg-red-50 hover:text-danger group-hover:opacity-100"
                  >
                    {deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-soft">
                  <span>{formatDate(r.date)}</span>
                  <span>{r.size ?? "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="active">{r.category}</Badge>
                  {r.tags?.map((t) => (
                    <span key={t} className="chip bg-bg-secondary text-ink-soft">{t}</span>
                  ))}
                  {r.hasFile && <span className="chip bg-primary-50 text-primary-700">Viewable</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && <DocViewer record={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function DocViewer({ record, onClose }: { record: VaultRecord; onClose: () => void }) {
  const url = vaultApi.fileUrl(record.id);
  const isImage = record.mime?.startsWith("image/");
  const isPdf = record.mime === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/[0.05] px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-ink">{record.title}</h3>
            <p className="truncate text-xs text-ink-soft">{record.provider} · {record.fileName ?? record.category}</p>
          </div>
          <div className="flex items-center gap-2">
            {record.hasFile && (
              <a href={url} download={record.fileName} className="btn-soft text-xs" onClick={(e) => e.stopPropagation()}>
                <Download className="h-4 w-4" /> Download
              </a>
            )}
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft hover:bg-bg-secondary"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="min-h-[300px] flex-1 overflow-auto bg-bg-secondary/40 p-4">
          {!record.hasFile ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-ink-soft">
              <FileQuestion className="h-12 w-12 text-primary-300" />
              <p className="mt-3 font-semibold text-ink">No document attached</p>
              <p className="mt-1 max-w-xs text-sm">This is a sample record with no uploaded file. Upload a record with a file to view it here.</p>
            </div>
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={record.title} className="mx-auto max-h-[70vh] rounded-2xl object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={record.title} className="h-[70vh] w-full rounded-2xl bg-white" />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-ink-soft">
              <FileText className="h-12 w-12 text-primary-300" />
              <p className="mt-3 font-semibold text-ink">Preview not available</p>
              <p className="mt-1 text-sm">This file type can&apos;t be previewed inline.</p>
              <a href={url} download={record.fileName} className="btn-primary mt-4" onClick={(e) => e.stopPropagation()}>
                <Download className="h-4 w-4" /> Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
