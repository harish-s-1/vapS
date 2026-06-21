"use client";

/**
 * Client-side helpers for surfacing AI safety findings *in context*.
 * The agents run invisibly on the server; these helpers map the resulting report
 * onto specific prescription cards and medication cards so alerts appear only
 * inside the existing Prescription / Medication workflows.
 */
import type { AgentFinding, AgentKind, SafetyReport, UIStatus } from "@/server/agents/types";

export interface FindingIndex {
  /** prescription code (lowercased) → findings affecting it */
  byPrescription: Map<string, AgentFinding[]>;
  /** medication name (lowercased) → findings affecting it */
  byMedication: Map<string, AgentFinding[]>;
}

export function indexFindings(report: SafetyReport | null): FindingIndex {
  const byPrescription = new Map<string, AgentFinding[]>();
  const byMedication = new Map<string, AgentFinding[]>();
  if (!report) return { byPrescription, byMedication };

  for (const f of report.findings) {
    for (const code of f.affectedPrescriptions) {
      const k = code.toLowerCase();
      byPrescription.set(k, [...(byPrescription.get(k) ?? []), f]);
    }
    for (const name of f.affectedItems) {
      const k = name.toLowerCase();
      byMedication.set(k, [...(byMedication.get(k) ?? []), f]);
    }
  }
  return { byPrescription, byMedication };
}

/** Pick the most severe finding (for card tint + badge). */
export function topFinding(findings: AgentFinding[] | undefined): AgentFinding | null {
  if (!findings || !findings.length) return null;
  const rank: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
  return [...findings].sort((a, b) => rank[b.severity] - rank[a.severity])[0];
}

export const badgeForAgent: Record<AgentKind, string> = {
  allergy: "ALLERGY ALERT",
  fraud: "FRAUD ALERT",
  mixing: "INTERACTION",
  dosage: "REMINDER",
};

export const cardTint: Record<UIStatus, string> = {
  ok: "",
  warn: "border-amber-200 bg-amber-50/50",
  danger: "border-red-200 bg-red-50/60",
};

export const iconTint: Record<UIStatus, string> = {
  ok: "bg-primary-50 text-primary-600",
  warn: "bg-amber-100 text-warning",
  danger: "bg-red-100 text-danger",
};
