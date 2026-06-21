/**
 * MASTER AI SAFETY ENGINE.
 *
 * Pipeline (per the spec):
 *   Prescription Uploaded
 *     ↓ Fraud Detection
 *     ↓ Allergy Prevention
 *     ↓ Medication Mixing Detection
 *     ↓ Dosage Reminder Generation
 *     ↓ Patient Notification Layer
 *
 * Assembles a normalized SafetyContext from the prescription + medication stores,
 * runs every agent independently, aggregates severities, persists the report, and
 * appends to the decision log. Designed to be triggered automatically whenever a
 * prescription is uploaded/modified, a medication is added, or allergies change.
 */
import { patientProfile } from "@/lib/mock-data";
import { listPrescriptions } from "@/server/store";
import { summary as medsSummary } from "@/server/medications-store";
import {
  ingredientsOf,
  parseDoseMg,
  parseDurationDays,
} from "./drug-knowledge";
import { runMixingAgent } from "./agent-mixing";
import { runAllergyAgent } from "./agent-allergy";
import { runFraudAgent } from "./agent-fraud";
import { runDosageAgent } from "./agent-dosage";
import { appendLog, saveReport } from "./alerts-store";
import {
  SEVERITY_RANK,
  uiStatusForSeverity,
  type ActiveMedication,
  type AgentKind,
  type AgentResult,
  type DecisionLogEntry,
  type SafetyContext,
  type SafetyReport,
  type Severity,
} from "./types";

const DEFAULT_PATIENT = "Ananya Sharma";

async function buildContext(patient: string, opts: { allergies?: string[]; trigger: string }): Promise<SafetyContext> {
  const prescriptions = await listPrescriptions(patient);

  const activeMedications: ActiveMedication[] = [];
  for (const rx of prescriptions) {
    if (rx.status === "expired") continue;
    const active = rx.status === "active" || rx.status === "dispensed";
    if (!active) continue;
    for (const med of rx.medicines) {
      activeMedications.push({
        prescriptionId: rx.id,
        code: rx.code,
        name: med.name,
        ingredients: ingredientsOf(med.name),
        dosageMg: parseDoseMg(med.dosage),
        frequency: med.frequency,
        durationDays: parseDurationDays(med.duration),
        doctor: rx.doctor,
        date: rx.date,
      });
    }
  }

  const history = prescriptions.map((rx) => ({
    code: rx.code,
    ingredients: Array.from(new Set(rx.medicines.flatMap((m) => ingredientsOf(m.name)))),
    doctor: rx.doctor,
    date: rx.date,
  }));

  let adherence = 86;
  try {
    adherence = (await medsSummary(patient)).adherence;
  } catch {
    /* meds store may be empty */
  }

  return {
    patient,
    allergies: opts.allergies ?? patientProfile.allergies,
    activeMedications,
    history,
    adherence,
    trigger: opts.trigger,
  };
}

export interface RunOptions {
  allergies?: string[];
  trigger?: string;
}

export async function runSafetyPipeline(patient = DEFAULT_PATIENT, opts: RunOptions = {}): Promise<SafetyReport> {
  const trigger = opts.trigger ?? "manual_scan";
  const ctx = await buildContext(patient, { allergies: opts.allergies, trigger });

  // Run each agent independently, in pipeline order.
  const fraud = runFraudAgent(ctx);
  const allergy = runAllergyAgent(ctx);
  const mixing = runMixingAgent(ctx);
  const dosage = runDosageAgent(ctx);

  const agents: Record<AgentKind, AgentResult> = { fraud, allergy, mixing, dosage };

  // Aggregate
  const findings = [fraud, allergy, mixing, dosage]
    .flatMap((a) => a.findings)
    .filter((f) => f.severity !== "none")
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const overallSeverity: Severity = (Object.values(agents)
    .map((a) => a.severity)
    .sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a])[0] ?? "none") as Severity;

  // Notification layer: only "action required" items (medium+), plus dosage reminders.
  const notifications = findings
    .filter((f) => SEVERITY_RANK[f.severity] >= SEVERITY_RANK["medium"])
    .map((f) => ({ severity: f.severity, title: f.title, body: f.explanation }));

  const report: SafetyReport = {
    patient,
    generatedAt: new Date().toISOString(),
    overallSeverity,
    overallStatus: uiStatusForSeverity(overallSeverity),
    agents,
    findings,
    notifications,
  };

  await saveReport(report);

  // Decision log — one entry per agent run + an engine summary.
  const now = new Date().toISOString();
  const logEntries: DecisionLogEntry[] = (Object.keys(agents) as AgentKind[]).map((k) => ({
    at: now,
    patient,
    trigger,
    agent: k,
    severity: agents[k].severity,
    summary: agents[k].findings.length
      ? agents[k].findings.map((f) => f.title).join("; ")
      : "no issues detected",
  }));
  logEntries.push({
    at: now,
    patient,
    trigger,
    agent: "engine",
    severity: overallSeverity,
    summary: `pipeline complete — ${findings.length} finding(s), overall ${overallSeverity}`,
  });
  await appendLog(logEntries);

  return report;
}
