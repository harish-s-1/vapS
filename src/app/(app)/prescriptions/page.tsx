"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ShieldCheck, ShieldAlert, Stethoscope, Calendar, Pill, Loader2, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { QR } from "@/components/ui/qr";
import { prescriptionsApi, safetyApi, type SafetyReport } from "@/lib/api";
import { indexFindings, topFinding, badgeForAgent } from "@/lib/safety";
import { useAuth } from "@/lib/store";
import type { Prescription } from "@/lib/types";
import type { AgentFinding } from "@/server/agents/types";
import { formatDate, cn } from "@/lib/utils";

export default function PrescriptionsPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";
  const [items, setItems] = useState<Prescription[]>([]);
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([prescriptionsApi.list(patient), safetyApi.report(patient)])
      .then(([rows, rep]) => {
        setItems(rows);
        setReport(rep);
        setSelected(rows[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [patient]);

  const index = useMemo(() => indexFindings(report), [report]);
  const findingsFor = (code: string) => index.byPrescription.get(code.toLowerCase()) ?? [];

  const flaggedCount = useMemo(
    () => items.filter((p) => findingsFor(p.code).length > 0).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, index]
  );
  const safetyScore = Math.max(40, 100 - flaggedCount * 12);
  const activeCount = items.filter((p) => p.status === "active" || p.status === "dispensed").length;

  if (loading) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }
  if (!selected) {
    return (
      <div>
        <PageHeader title="Prescriptions" subtitle="All your prescriptions in one place." />
        <Card className="text-sm text-ink-soft">No prescriptions yet. Ask your doctor to issue one.</Card>
      </div>
    );
  }

  const selFindings = findingsFor(selected.code);

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle="All your prescriptions in one place."
        action={<button className="btn-primary"><FileText className="h-4 w-4" /> Upload Prescription</button>}
      />

      {/* Stat row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<FileText className="h-5 w-5" />} tone="primary" n={items.length} l="Total Prescriptions" sub="All time" />
        <Stat icon={<Clock className="h-5 w-5" />} tone="amber" n={activeCount} l="Active Prescriptions" sub="Ongoing" />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} tone={flaggedCount ? "danger" : "primary"} n={flaggedCount} l="Safety Alerts" sub={flaggedCount ? "Action required" : "All clear"} />
        <Stat icon={<ShieldCheck className="h-5 w-5" />} tone="blue" n={`${safetyScore}%`} l="AI Safety Score" sub="This week" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* List */}
        <div className="space-y-3">
          <div className="px-1 text-sm font-bold text-ink-soft">Your Prescriptions</div>
          {items.map((p) => {
            const fs = findingsFor(p.code);
            const top = topFinding(fs);
            const flagged = !!top;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full rounded-3xl border bg-surface p-5 text-left shadow-card transition",
                  flagged
                    ? "border-red-200 bg-red-50/60"
                    : selected.id === p.id
                      ? "border-primary-300 shadow-soft"
                      : "border-black/[0.04] hover:shadow-soft"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", flagged ? "bg-red-100 text-danger" : "bg-primary-50 text-primary-600")}>
                      {flagged ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-ink">
                        {p.code}
                        {top && <span className="chip bg-red-100 text-danger">{badgeForAgent[top.agent]}</span>}
                      </div>
                      <div className="text-xs text-ink-soft">{p.medicines[0]?.name} · {p.doctor}</div>
                    </div>
                  </div>
                  {flagged ? <ChevronRight className="h-5 w-5 text-danger" /> : (
                    <Badge tone={p.status === "active" ? "active" : p.status === "dispensed" ? "approved" : "expired"}>{p.status}</Badge>
                  )}
                </div>
                {top ? (
                  <div className="mt-2 text-xs font-semibold text-danger">{top.title}</div>
                ) : (
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.date)}</span>
                    <span className="flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> {p.medicines.length} medicines</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <Card className="p-7">
          {/* Contextual safety alerts appear at the top of the prescription's own details */}
          {selFindings.map((f) => <AlertBlock key={f.id} finding={f} patientAllergy={(f.meta as { allergy?: string })?.allergy} />)}

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/[0.05] pb-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Prescription ID</div>
              <div className="text-xl font-extrabold text-ink">{selected.code}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                <Stethoscope className="h-4 w-4" /> {selected.doctor} · {formatDate(selected.date)}
              </div>
              {selected.signatureValid && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">
                  <ShieldCheck className="h-4 w-4" /> Digitally signed & verified
                </div>
              )}
            </div>
            <QR value={`https://pats.health/verify/${selected.code}`} />
          </div>

          <div className="mt-5">
            <div className="mb-3 text-sm font-bold text-ink">Medications</div>
            <div className="space-y-3">
              {selected.medicines.map((m, i) => (
                <div key={i} className="rounded-2xl bg-bg-secondary p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{m.name}</span>
                    <span className="text-sm font-semibold text-primary-600">{m.dosage}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs text-ink-soft sm:grid-cols-3">
                    <span>Frequency: {m.frequency}</span>
                    <span>Duration: {m.duration}</span>
                    {m.instructions && <span>Note: {m.instructions}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="btn-primary flex-1">Send to Pharmacy</button>
            <button className="btn-soft flex-1">Download PDF</button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary-500" />
        <span className="text-sm text-ink-soft">patS continuously checks your prescriptions for fraud, allergies, interactions and dosage safety.</span>
      </Card>
    </div>
  );
}

/** Contextual alert block rendered inside a prescription's details. */
function AlertBlock({ finding, patientAllergy }: { finding: AgentFinding; patientAllergy?: string }) {
  const meta = finding.meta as Record<string, unknown> | undefined;
  if (finding.agent === "allergy") {
    return (
      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/70 p-5">
        <div className="flex items-center gap-2 font-extrabold text-danger"><AlertTriangle className="h-5 w-5" /> ALLERGY ALERT</div>
        <p className="mt-1 text-sm text-ink-soft">This medication conflicts with your allergy profile.</p>
        <div className="mt-4 space-y-1.5 text-sm">
          <Row k="Your Allergy" v={patientAllergy ?? "—"} danger />
          <Row k="Detected Medication" v={finding.affectedItems[0] ?? "—"} danger />
          <Row k="Risk Level" v="HIGH" danger />
        </div>
        <p className="mt-3 text-xs text-ink-soft">{finding.explanation}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-100/60 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span><b>Recommended Action:</b> {finding.recommendation}</span>
        </div>
      </div>
    );
  }
  if (finding.agent === "fraud") {
    return (
      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/70 p-5">
        <div className="flex items-center gap-2 font-extrabold text-danger"><ShieldAlert className="h-5 w-5" /> POTENTIAL PRESCRIPTION FRAUD</div>
        <p className="mt-1 text-sm text-ink-soft">{finding.explanation}</p>
        <div className="mt-4 space-y-1.5 text-sm">
          <Row k="Same Medication" v={finding.affectedItems[0] ?? "—"} />
          <Row k="Prescriptions in 7 days" v={String(meta?.fills ?? "—")} />
          <Row k="Different Doctors" v={String(meta?.distinctDoctors ?? "—")} />
          {typeof finding.confidence === "number" && <Row k="Confidence" v={`${Math.round(finding.confidence * 100)}%`} danger />}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-100/60 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span><b>Recommended Action:</b> {finding.recommendation}</span>
        </div>
      </div>
    );
  }
  // mixing / interaction
  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
      <div className="flex items-center gap-2 font-extrabold text-warning"><AlertTriangle className="h-5 w-5" /> {finding.title.toUpperCase()}</div>
      <p className="mt-1 text-sm text-ink-soft">{finding.explanation}</p>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-100/60 px-3 py-2 text-xs text-amber-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span><b>Recommended Action:</b> {finding.recommendation}</span>
      </div>
    </div>
  );
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{k}</span>
      <span className={cn("font-bold", danger ? "text-danger" : "text-ink")}>{v}</span>
    </div>
  );
}

function Stat({ icon, tone, n, l, sub }: { icon: React.ReactNode; tone: "primary" | "amber" | "danger" | "blue"; n: number | string; l: string; sub: string }) {
  const map = {
    primary: "bg-primary-50 text-primary-600",
    amber: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
    blue: "bg-blue-50 text-info",
  };
  return (
    <Card className={cn(tone === "danger" && Number(n) > 0 ? "border border-red-200 bg-red-50/40" : "")}>
      <div className={cn("mb-2 grid h-11 w-11 place-items-center rounded-2xl", map[tone])}>{icon}</div>
      <div className="text-2xl font-extrabold text-ink">{n}</div>
      <div className="text-xs font-semibold text-ink">{l}</div>
      <div className="text-xs text-ink-soft">{sub}</div>
    </Card>
  );
}
