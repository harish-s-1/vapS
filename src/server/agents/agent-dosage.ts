/**
 * AGENT 4 — Dosage Reminder Engine.
 *
 * Converts active prescriptions into actionable medication schedules: per-medication
 * clock times, today's dose timeline with states (taken / upcoming / missed / due),
 * and an adherence percentage (sourced from the Medications module).
 *
 * Severity: informational (low) — surfaces as reminders, not warnings, unless
 * adherence is poor.
 */
import { randomUUID } from "node:crypto";
import { dosesPerDay, scheduleTimes } from "./drug-knowledge";
import {
  uiStatusForSeverity,
  type AgentFinding,
  type AgentResult,
  type DoseSlot,
  type DosageSchedule,
  type SafetyContext,
  type Severity,
} from "./types";

export function runDosageAgent(ctx: SafetyContext, now = new Date()): AgentResult {
  const perMedication: DosageSchedule["perMedication"] = [];
  const today: DoseSlot[] = [];
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const med of ctx.activeMedications) {
    const n = dosesPerDay(med.frequency);
    const times = scheduleTimes(n);
    perMedication.push({ medication: med.name, frequency: med.frequency, times, durationDays: med.durationDays });

    for (const t of times) {
      const [h, m] = t.split(":").map(Number);
      const slotMins = h * 60 + m;
      let state: DoseSlot["state"];
      if (slotMins > nowMins + 15) state = "upcoming";
      else if (Math.abs(slotMins - nowMins) <= 15) state = "due";
      else state = ctx.adherence >= 80 ? "taken" : "missed"; // past slot — infer from adherence
      today.push({ medication: med.name, time: t, label: to12h(t), state });
    }
  }

  today.sort((a, b) => a.time.localeCompare(b.time));

  const schedule: DosageSchedule = { perMedication, today, adherence: ctx.adherence };

  // Surface a finding only when adherence needs attention, plus an informational reminder.
  const findings: AgentFinding[] = [];
  const upcoming = today.filter((d) => d.state === "upcoming" || d.state === "due");
  if (upcoming.length) {
    findings.push({
      id: randomUUID(),
      agent: "dosage",
      severity: "low",
      uiStatus: "ok",
      title: "Upcoming Doses Today",
      explanation: `You have ${upcoming.length} dose${upcoming.length > 1 ? "s" : ""} remaining today: ${upcoming.map((u) => `${u.medication} at ${u.label}`).join(", ")}.`,
      recommendation: "Reminders scheduled. Mark each dose as taken to keep your adherence score up.",
      affectedItems: Array.from(new Set(upcoming.map((u) => u.medication))),
      affectedPrescriptions: [],
    });
  }
  if (ctx.adherence < 80) {
    findings.push({
      id: randomUUID(),
      agent: "dosage",
      severity: "medium",
      uiStatus: "warn",
      title: "Adherence Needs Attention",
      explanation: `Your medication adherence is ${ctx.adherence}%, below the recommended 80%.`,
      recommendation: "Enable voice/push reminders and try to take doses on schedule.",
      affectedItems: [],
      affectedPrescriptions: [],
    });
  }

  const severity: Severity = ctx.adherence < 80 ? "medium" : "low";
  return { agent: "dosage", ran: true, severity, uiStatus: uiStatusForSeverity(severity), findings, data: schedule };
}

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}
