/**
 * AGENT 3 — Prescription Fraud / Misuse Detection.
 *
 * Behavioral (not signature) fraud. Over a rolling window it flags:
 *   • same drug from multiple distinct doctors ("doctor shopping")
 *   • repeated prescriptions of the same drug in a short period
 *   • controlled-substance acquisition anomalies
 *
 * Severity: HIGH for controlled substances, MEDIUM otherwise.
 * Never auto-blocks — flags for review with a confidence score.
 */
import { randomUUID } from "node:crypto";
import { isControlled } from "./drug-knowledge";
import { uiStatusForSeverity, type AgentFinding, type AgentResult, type SafetyContext, type Severity } from "./types";

const WINDOW_DAYS = 7;
const DOCTOR_SHOPPING_THRESHOLD = 3; // distinct doctors for same drug within window
const REPEAT_THRESHOLD = 4; // total fills of same drug within window

export function runFraudAgent(ctx: SafetyContext): AgentResult {
  const findings: AgentFinding[] = [];

  // Group prescription history by active ingredient
  const byIngredient = new Map<string, { code: string; doctor: string; date: string }[]>();
  for (const rx of ctx.history) {
    for (const ing of rx.ingredients) {
      const list = byIngredient.get(ing) ?? [];
      list.push({ code: rx.code, doctor: rx.doctor, date: rx.date });
      byIngredient.set(ing, list);
    }
  }

  for (const [ingredient, fills] of byIngredient) {
    if (fills.length < 2) continue;
    const sorted = [...fills].sort((a, b) => +new Date(a.date) - +new Date(b.date));

    // Find the densest WINDOW_DAYS span (sliding window)
    let best = { count: 0, doctors: new Set<string>(), codes: [] as string[], start: "", end: "" };
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = +new Date(sorted[i].date);
      const inWindow = sorted.filter((f) => {
        const t = +new Date(f.date);
        return t >= windowStart && t <= windowStart + WINDOW_DAYS * 864e5;
      });
      if (inWindow.length > best.count) {
        best = {
          count: inWindow.length,
          doctors: new Set(inWindow.map((f) => f.doctor)),
          codes: inWindow.map((f) => f.code),
          start: inWindow[0].date,
          end: inWindow[inWindow.length - 1].date,
        };
      }
    }

    const distinctDoctors = best.doctors.size;
    const controlled = isControlled(ingredient);
    const doctorShopping = distinctDoctors >= DOCTOR_SHOPPING_THRESHOLD;
    const repeated = best.count >= REPEAT_THRESHOLD;

    if (doctorShopping || repeated) {
      // Confidence: weighted by doctor count, fill count, and controlled status
      let confidence = 0.4 + Math.min(0.4, (distinctDoctors - 2) * 0.12) + Math.min(0.2, (best.count - 3) * 0.06);
      if (controlled) confidence += 0.15;
      confidence = Math.max(0.4, Math.min(0.97, confidence));

      const severity: Severity = controlled ? "high" : "medium";
      const drugLabel = cap(ingredient);
      findings.push({
        id: randomUUID(),
        agent: "fraud",
        severity,
        uiStatus: uiStatusForSeverity(severity),
        title: "Potential Prescription Misuse Detected",
        explanation:
          `${best.count} prescriptions for ${drugLabel} were issued by ${distinctDoctors} different doctor${distinctDoctors > 1 ? "s" : ""} within ${WINDOW_DAYS} days.` +
          (controlled ? ` ${drugLabel} is a controlled substance.` : "") +
          " This pattern may indicate doctor shopping or prescription abuse.",
        recommendation: "Flagged for clinical review. Not blocked — confirm legitimate need with the prescriber.",
        affectedItems: [drugLabel],
        affectedPrescriptions: best.codes,
        confidence: Math.round(confidence * 100) / 100,
        meta: { ingredient, distinctDoctors, fills: best.count, windowDays: WINDOW_DAYS, controlled },
      });
    }
  }

  const severity = highest(findings);
  return { agent: "fraud", ran: true, severity, uiStatus: uiStatusForSeverity(severity), findings };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function highest(findings: AgentFinding[]): Severity {
  const order: Severity[] = ["none", "low", "medium", "high"];
  return findings.reduce<Severity>((acc, f) => (order.indexOf(f.severity) > order.indexOf(acc) ? f.severity : acc), "none");
}
