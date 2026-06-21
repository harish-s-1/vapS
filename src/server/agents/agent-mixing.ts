/**
 * AGENT 1 — Medication Mixing Detection.
 *
 * Detects, across all currently active medications:
 *   • duplicate active ingredients (different brands, same molecule)
 *   • dangerous drug–drug interactions
 *   • cumulative dosage that exceeds the safe daily maximum
 *
 * Severity: typically MEDIUM (HIGH for severe interactions).
 */
import { randomUUID } from "node:crypto";
import { findInteraction, maxDailyMg } from "./drug-knowledge";
import { uiStatusForSeverity, type AgentFinding, type AgentResult, type SafetyContext, type Severity } from "./types";

export function runMixingAgent(ctx: SafetyContext): AgentResult {
  const meds = ctx.activeMedications;
  const findings: AgentFinding[] = [];

  // 1. Duplicate active ingredients across different medications
  const byIngredient = new Map<string, typeof meds>();
  for (const m of meds) {
    for (const ing of m.ingredients) {
      const list = byIngredient.get(ing) ?? [];
      list.push(m);
      byIngredient.set(ing, list);
    }
  }
  for (const [ingredient, list] of byIngredient) {
    const distinct = Array.from(new Set(list.map((m) => m.name)));
    if (distinct.length > 1) {
      findings.push({
        id: randomUUID(),
        agent: "mixing",
        severity: "medium",
        uiStatus: "warn",
        title: "Potential Medication Conflict Detected",
        explanation: `${distinct.join(", ")} ${distinct.length > 2 ? "all" : "both"} contain ${cap(ingredient)}. Taking them together may result in accidental overdose.`,
        recommendation: "Please consult your doctor before taking these together.",
        affectedItems: distinct,
        affectedPrescriptions: Array.from(new Set(list.map((m) => m.code))),
        meta: { ingredient },
      });

      // 1b. Cumulative dosage accumulation for that duplicated ingredient
      const cap_mg = maxDailyMg(ingredient);
      if (cap_mg) {
        const total = list.reduce((s, m) => s + (m.dosageMg ?? 0) * dailyMultiplier(m.frequency), 0);
        if (total > cap_mg) {
          findings.push({
            id: randomUUID(),
            agent: "mixing",
            severity: "high",
            uiStatus: "danger",
            title: "Excessive Dosage Accumulation",
            explanation: `Combined daily ${cap(ingredient)} from ${distinct.join(" + ")} is ~${total} mg, above the safe limit of ${cap_mg} mg/day.`,
            recommendation: "Stop one of these medicines and contact your doctor immediately.",
            affectedItems: distinct,
            affectedPrescriptions: Array.from(new Set(list.map((m) => m.code))),
            meta: { ingredient, total, limit: cap_mg },
          });
        }
      }
    }
  }

  // 2. Pairwise dangerous interactions
  for (let i = 0; i < meds.length; i++) {
    for (let j = i + 1; j < meds.length; j++) {
      for (const ia of meds[i].ingredients) {
        for (const ib of meds[j].ingredients) {
          const rule = findInteraction(ia, ib);
          if (rule) {
            findings.push({
              id: randomUUID(),
              agent: "mixing",
              severity: rule.severity as Severity,
              uiStatus: uiStatusForSeverity(rule.severity as Severity),
              title: `Drug Interaction: ${cap(ia)} + ${cap(ib)}`,
              explanation: rule.detail,
              recommendation: rule.recommendation,
              affectedItems: [meds[i].name, meds[j].name],
              affectedPrescriptions: Array.from(new Set([meds[i].code, meds[j].code])),
              meta: { pair: [ia, ib] },
            });
          }
        }
      }
    }
  }

  return finalize(findings);
}

function dailyMultiplier(frequency: string): number {
  const f = frequency.toLowerCase();
  if (/(thrice|three|tid)/.test(f)) return 3;
  if (/(twice|two|bid)/.test(f)) return 2;
  if (/(four|qid)/.test(f)) return 4;
  return 1;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function finalize(findings: AgentFinding[]): AgentResult {
  const severity = highest(findings);
  return { agent: "mixing", ran: true, severity, uiStatus: uiStatusForSeverity(severity), findings };
}

function highest(findings: AgentFinding[]): Severity {
  const order: Severity[] = ["none", "low", "medium", "high"];
  return findings.reduce<Severity>((acc, f) => (order.indexOf(f.severity) > order.indexOf(acc) ? f.severity : acc), "none");
}
