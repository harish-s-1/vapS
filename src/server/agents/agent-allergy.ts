/**
 * AGENT 2 — Allergy Prevention.
 *
 * Cross-references the patient's allergy profile against the active ingredients and
 * drug families of every medication (e.g. Amoxicillin → Penicillin family).
 *
 * Severity: HIGH (allergy conflicts are never auto-dismissed).
 */
import { randomUUID } from "node:crypto";
import { allergyConflict } from "./drug-knowledge";
import { uiStatusForSeverity, type AgentFinding, type AgentResult, type SafetyContext, type Severity } from "./types";

export function runAllergyAgent(ctx: SafetyContext): AgentResult {
  const findings: AgentFinding[] = [];

  for (const med of ctx.activeMedications) {
    for (const ingredient of med.ingredients) {
      for (const allergy of ctx.allergies) {
        const hit = allergyConflict(allergy, ingredient);
        if (hit) {
          const familyNote = hit.family
            ? ` ${cap(ingredient)} belongs to the ${hit.family} family.`
            : "";
          findings.push({
            id: randomUUID(),
            agent: "allergy",
            severity: "high",
            uiStatus: "danger",
            title: "Allergy Conflict Detected",
            explanation: `Patient has a ${cap(allergy)} allergy.${familyNote} Taking ${med.name} may cause a severe allergic reaction.`,
            recommendation: "Do not take this medication. Contact your doctor before use.",
            affectedItems: [med.name],
            affectedPrescriptions: [med.code],
            meta: { allergy, ingredient, family: hit.family },
          });
        }
      }
    }
  }

  // de-duplicate identical (med, allergy) hits
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    const k = `${f.affectedItems[0]}::${(f.meta as { allergy: string }).allergy}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const severity: Severity = unique.length ? "high" : "none";
  return { agent: "allergy", ran: true, severity, uiStatus: uiStatusForSeverity(severity), findings: unique };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
