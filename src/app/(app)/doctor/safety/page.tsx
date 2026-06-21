"use client";

import { useState } from "react";
import { Brain, AlertTriangle, ShieldCheck, Plus, X, Zap, Activity, Pill } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { Donut } from "@/components/ui/charts";
import { patientProfile } from "@/lib/mock-data";
import type { Severity } from "@/lib/types";

interface Finding { kind: "interaction" | "allergy" | "duplicate" | "dosage"; severity: Severity; title: string; detail: string; recommendation: string }

// Tiny rules engine over a known interaction/allergy table
const interactionTable: Record<string, { with: string; severity: Severity; detail: string; rec: string }[]> = {
  aspirin: [{ with: "atorvastatin", severity: "moderate", detail: "Increased risk of myopathy when combined.", rec: "Monitor for muscle pain; check CK if symptomatic." }],
  warfarin: [{ with: "aspirin", severity: "high", detail: "Markedly increased bleeding risk.", rec: "Avoid combination unless clearly indicated; monitor INR." }],
  metformin: [{ with: "contrast", severity: "high", detail: "Risk of lactic acidosis with iodinated contrast.", rec: "Pause 48h around contrast imaging." }],
};

function analyze(current: string[], incoming: string[]): { findings: Finding[]; score: number } {
  const findings: Finding[] = [];
  const all = [...current, ...incoming].map((m) => m.trim().toLowerCase()).filter(Boolean);

  // duplicates
  const seen = new Set<string>();
  for (const m of all) {
    if (seen.has(m)) findings.push({ kind: "duplicate", severity: "moderate", title: `Duplicate: ${m}`, detail: "This medicine appears more than once across the regimen.", recommendation: "Consolidate to a single order to avoid double-dosing." });
    seen.add(m);
  }
  // interactions
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      for (const key of Object.keys(interactionTable)) {
        if (!a.includes(key)) continue;
        const hit = interactionTable[key].find((r) => b.includes(r.with));
        if (hit) findings.push({ kind: "interaction", severity: hit.severity, title: `${a.split(" ")[0]} + ${b.split(" ")[0]}`, detail: hit.detail, recommendation: hit.rec });
      }
    }
  }
  // allergies
  for (const m of incoming) {
    for (const allergy of patientProfile.allergies) {
      if (m.toLowerCase().includes(allergy.toLowerCase().slice(0, 4)) && allergy.toLowerCase().startsWith(m.toLowerCase().slice(0, 4))) {
        findings.push({ kind: "allergy", severity: "critical", title: `Allergy: ${m}`, detail: `Patient has a recorded allergy to ${allergy}.`, recommendation: "Do not prescribe. Select an alternative agent." });
      }
    }
  }

  const weight = { low: 8, moderate: 22, high: 40, critical: 60 };
  const risk = Math.min(100, findings.reduce((s, f) => s + weight[f.severity], 0));
  return { findings, score: risk };
}

const sevColor: Record<Severity, string> = { low: "#4CAF50", moderate: "#F59E0B", high: "#FB923C", critical: "#EF4444" };
const kindIcon = { interaction: Zap, allergy: AlertTriangle, duplicate: Pill, dosage: Activity };

export default function SafetyPage() {
  const [incoming, setIncoming] = useState<string[]>(["Aspirin 75mg", "Atorvastatin 10mg"]);
  const [draft, setDraft] = useState("");
  const current = ["Metformin 500mg", "Vitamin D3"];
  const { findings, score } = analyze(current, incoming);
  const band = score >= 60 ? { label: "High Risk", color: "#EF4444" } : score >= 30 ? { label: "Moderate Risk", color: "#F59E0B" } : { label: "Low Risk", color: "#4CAF50" };

  return (
    <div>
      <PageHeader title="AI Clinical Safety Engine" subtitle="Real-time interaction, allergy, duplicate & dosage analysis." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Inputs */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 text-sm font-bold text-ink">Patient Context</h3>
            <div className="space-y-2 text-sm">
              <Ctx label="Allergies" value={patientProfile.allergies.join(", ")} tone="text-danger" />
              <Ctx label="Chronic" value={patientProfile.chronicConditions.join(", ")} />
              <Ctx label="Current Meds" value={current.join(", ")} />
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-bold text-ink">New Prescription</h3>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { setIncoming((m) => [...m, draft.trim()]); setDraft(""); } }}
                placeholder="Add medicine (e.g. Penicillin)…"
                className="input"
              />
              <button onClick={() => { if (draft.trim()) { setIncoming((m) => [...m, draft.trim()]); setDraft(""); } }} className="grid w-12 shrink-0 place-items-center rounded-2xl bg-primary-500 text-white">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {incoming.map((m, i) => (
                <span key={i} className="chip bg-primary-50 text-primary-700">
                  {m}
                  <button onClick={() => setIncoming((arr) => arr.filter((_, idx) => idx !== i))}><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft">Try adding <b>Penicillin</b> (allergy) or <b>Warfarin</b> (interaction) to see alerts.</p>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-5">
          <Card className="flex items-center gap-6">
            <Donut value={score} color={band.color} track="#EEF2EF" label={`${score}`} sublabel="Risk Score" />
            <div>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary-500" />
                <span className="text-lg font-extrabold" style={{ color: band.color }}>{band.label}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {findings.length === 0
                  ? "No safety concerns detected for this combination."
                  : `${findings.length} issue(s) detected across interactions, allergies & duplicates.`}
              </p>
            </div>
          </Card>

          {findings.length === 0 ? (
            <Card className="flex items-center gap-3 bg-primary-50/50">
              <ShieldCheck className="h-6 w-6 text-primary-500" />
              <span className="text-sm font-semibold text-primary-700">Safe to prescribe — no conflicts found.</span>
            </Card>
          ) : (
            <div className="space-y-3">
              {findings.map((f, i) => {
                const Icon = kindIcon[f.kind];
                return (
                  <Card key={i} className="p-5" style={{ borderLeft: `4px solid ${sevColor[f.severity]}` }}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `${sevColor[f.severity]}1a`, color: sevColor[f.severity] }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold capitalize text-ink">{f.title}</span>
                          <Badge tone={f.severity}>{f.severity}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-ink-soft">{f.detail}</p>
                        <div className="mt-2 rounded-xl bg-bg-secondary px-3 py-2 text-xs text-ink">
                          <b>Recommendation:</b> {f.recommendation}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Ctx({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-bg-secondary px-3 py-2">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className={`text-sm font-semibold ${tone ?? "text-ink"}`}>{value}</span>
    </div>
  );
}
