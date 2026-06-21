"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pill, Clock, Check, X, Loader2, AlertTriangle, CalendarDays, ShieldCheck, ChevronRight, Info } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { medsApi, safetyApi, type AdherenceSummary, type DoseStatus, type SafetyReport } from "@/lib/api";
import { indexFindings, topFinding } from "@/lib/safety";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";
import type { AgentFinding } from "@/server/agents/types";

export default function MedicationsPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [meds, setMeds] = useState<Medication[]>([]);
  const [sum, setSum] = useState<AdherenceSummary | null>(null);
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [alert, setAlert] = useState<AgentFinding | null>(null); // popup

  const load = useCallback(
    () =>
      Promise.all([medsApi.list(patient), medsApi.summary(patient), safetyApi.report(patient)]).then(
        ([m, s, r]) => { setMeds(m); setSum(s); setReport(r); }
      ),
    [patient]
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const index = useMemo(() => indexFindings(report), [report]);
  const mixingFor = (name: string) =>
    (index.byMedication.get(name.toLowerCase()) ?? []).filter((f) => f.agent === "mixing");

  const flaggedCount = useMemo(
    () => meds.filter((m) => mixingFor(m.name).length > 0).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meds, index]
  );

  const log = async (id: string, status: DoseStatus) => {
    setBusy(id + status);
    try { await medsApi.logDose(id, status); await load(); } finally { setBusy(null); }
  };

  if (loading || !sum) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  const nextDose = meds[0]?.nextDose ?? "—";

  return (
    <div>
      <PageHeader
        title="Medications"
        subtitle="All your current and past medications in one place."
        action={<button className="btn-primary"><Pill className="h-4 w-4" /> Add Medication</button>}
      />

      {/* Stat row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Pill className="h-5 w-5" />} tone="primary" n={meds.length} l="Active Medications" sub="Ongoing" />
        <Stat icon={<Clock className="h-5 w-5" />} tone="amber" n={1} l="Upcoming Dose" sub={nextDose} />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} tone={flaggedCount ? "danger" : "primary"} n={flaggedCount} l="Safety Alert" sub={flaggedCount ? "Action required" : "All clear"} />
        <Stat icon={<CalendarDays className="h-5 w-5" />} tone="blue" n={`${sum.adherence}%`} l="Adherence Score" sub="This week" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-soft">Active Medications</h3>
        <span className="text-xs text-ink-soft">Sort by: Next Dose</span>
      </div>
      <div className="space-y-4">
        {meds.map((m) => {
          const fs = mixingFor(m.name);
          const top = topFinding(fs);
          const flagged = !!top;
          const ingredient = top?.meta && (top.meta as { ingredient?: string }).ingredient;
          return (
            <Card key={m.id} className={cn(flagged && "border border-red-200 bg-red-50/60")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", flagged ? "bg-red-100 text-danger" : "bg-emerald-50 text-emerald")}>
                    {flagged ? <AlertTriangle className="h-5 w-5" /> : <Pill className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-ink">{m.name} <span className="text-sm font-medium text-ink-soft">{m.dosage}</span></div>
                    <div className="text-xs text-ink-soft">{m.frequency} · next {m.nextDose}</div>
                  </div>
                </div>
                <span className="rounded-xl bg-bg-secondary px-3 py-1 text-sm font-semibold text-ink">{m.nextDose?.split(", ")[1] ?? m.time.split(",")[0]}</span>
              </div>

              {flagged && (
                <button onClick={() => setAlert(top!)} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-red-100/60 px-4 py-2.5 text-left text-sm font-semibold text-danger transition hover:bg-red-100">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Potential duplicate: Contains {ingredient ? cap(ingredient) : "same ingredient"} (tap for details)</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Adherence</span>
                  <span className="font-bold text-ink">{m.adherence}%</span>
                </div>
                <ProgressBar value={m.adherence} tone={m.adherence >= 85 ? "primary" : m.adherence >= 70 ? "amber" : "danger"} />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => log(m.id, "taken")}
                  disabled={busy !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
                >
                  {busy === m.id + "taken" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Mark Taken
                </button>
                <button onClick={() => log(m.id, "skipped")} disabled={busy !== null} className="btn-soft disabled:opacity-60">
                  {busy === m.id + "skipped" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Skip
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-ink-soft"><Info className="h-4 w-4" /> patS continuously checks for drug interactions, allergies, and duplicate ingredients.</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-soft"><ShieldCheck className="h-4 w-4 text-primary-500" /> Last checked: just now</span>
      </Card>

      {/* Contextual safety popup — only appears inside the medication workflow */}
      {alert && <MixingPopup finding={alert} onClose={() => setAlert(null)} />}
    </div>
  );
}

function MixingPopup({ finding, onClose }: { finding: AgentFinding; onClose: () => void }) {
  const ingredient = (finding.meta as { ingredient?: string })?.ingredient;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-in rounded-3xl bg-surface p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end"><button onClick={onClose} className="text-ink-soft hover:text-ink"><X className="h-5 w-5" /></button></div>
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-danger"><AlertTriangle className="h-7 w-7" /></div>
          <h3 className="mt-3 text-lg font-extrabold text-ink">Medication Safety Alert</h3>
          <p className="mt-1 text-sm text-ink-soft">We detected that the following medications contain the same active ingredient:</p>
          {ingredient && <div className="mt-3 w-full rounded-2xl bg-red-50 py-2 text-center font-bold text-danger">{cap(ingredient)}</div>}
        </div>
        <div className="mt-4">
          <div className="text-sm font-bold text-ink">Medications Involved</div>
          <ul className="mt-1 space-y-1 text-sm text-ink-soft">
            {finding.affectedItems.map((a) => <li key={a} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> {a}</li>)}
          </ul>
        </div>
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-danger">{finding.explanation}</div>
        <div className="mt-4">
          <div className="text-sm font-bold text-ink">What should you do?</div>
          <p className="mt-1 text-sm text-ink-soft">{finding.recommendation}</p>
        </div>
        <button className="mt-5 w-full rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600">Contact Doctor</button>
        <button onClick={onClose} className="btn-soft mt-2 w-full">Dismiss</button>
      </div>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function Stat({ icon, tone, n, l, sub }: { icon: React.ReactNode; tone: "primary" | "amber" | "danger" | "blue"; n: number | string; l: string; sub: string }) {
  const map = { primary: "bg-primary-50 text-primary-600", amber: "bg-amber-50 text-warning", danger: "bg-red-50 text-danger", blue: "bg-blue-50 text-info" };
  return (
    <Card className={cn(tone === "danger" && Number(n) > 0 ? "border border-red-200 bg-red-50/40" : "")}>
      <div className={cn("mb-2 grid h-11 w-11 place-items-center rounded-2xl", map[tone])}>{icon}</div>
      <div className="text-2xl font-extrabold text-ink">{n}</div>
      <div className="text-xs font-semibold text-ink">{l}</div>
      <div className="text-xs text-ink-soft">{sub}</div>
    </Card>
  );
}
