"use client";

import type { Appointment, AppointmentType, ConsentRequest, Guardian, Medication, Prescription, RecoveryState, ReminderType, Role, TimelineEvent, TimelineEventType, VaultRecord, VaultCategory, VoiceReminder } from "./types";
import type { DecisionLogEntry, SafetyReport } from "@/server/agents/types";

/**
 * Frontend API client for the live Prescriptions module.
 * Talks to the Next.js Route Handlers under /api (same origin), which persist
 * to the server-side store. All calls are real client → server round trips.
 */

export interface VerifyResult {
  verified: boolean;
  reason?: string;
  prescription?: Prescription;
}

export interface NewPrescription {
  patient: string;
  doctor: string;
  medicines: Prescription["medicines"];
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const prescriptionsApi = {
  async list(patient?: string): Promise<Prescription[]> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: Prescription[] }>(await fetch(`/api/prescriptions${qs}`, { cache: "no-store" }));
    return data;
  },

  async create(input: NewPrescription): Promise<Prescription> {
    const { data } = await json<{ data: Prescription }>(
      await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },

  async verify(code: string): Promise<VerifyResult> {
    return json<VerifyResult>(
      await fetch(`/api/prescriptions/verify/${encodeURIComponent(code)}`, { cache: "no-store" })
    );
  },
};

export interface NewConsent {
  patient: string;
  requester: string;
  requesterRole: Role;
  scope: string;
}

export type ConsentDecision = "approved" | "rejected" | "revoked";

export const consentApi = {
  async list(filter: { patient?: string; requester?: string } = {}): Promise<ConsentRequest[]> {
    const qs = new URLSearchParams();
    if (filter.patient) qs.set("patient", filter.patient);
    if (filter.requester) qs.set("requester", filter.requester);
    const suffix = qs.toString() ? `?${qs}` : "";
    const { data } = await json<{ data: ConsentRequest[] }>(await fetch(`/api/consent${suffix}`, { cache: "no-store" }));
    return data;
  },

  async create(input: NewConsent): Promise<ConsentRequest> {
    const { data } = await json<{ data: ConsentRequest }>(
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },

  async decide(id: string, decision: ConsentDecision): Promise<ConsentRequest> {
    const { data } = await json<{ data: ConsentRequest }>(
      await fetch(`/api/consent/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
    );
    return data;
  },
};

export interface NewVaultRecord {
  patient: string;
  title: string;
  category: VaultCategory;
  provider?: string;
  size?: string;
  tags?: string[];
  file?: File | null;
}

export const vaultApi = {
  async list(filter: { patient?: string; category?: string; q?: string } = {}): Promise<VaultRecord[]> {
    const qs = new URLSearchParams();
    if (filter.patient) qs.set("patient", filter.patient);
    if (filter.category && filter.category !== "All") qs.set("category", filter.category);
    if (filter.q) qs.set("q", filter.q);
    const suffix = qs.toString() ? `?${qs}` : "";
    const { data } = await json<{ data: VaultRecord[] }>(await fetch(`/api/vault${suffix}`, { cache: "no-store" }));
    return data;
  },

  async create(input: NewVaultRecord): Promise<VaultRecord> {
    // When a real file is attached, upload as multipart so the bytes are stored
    // and the document can be viewed later.
    const fd = new FormData();
    fd.set("patient", input.patient);
    fd.set("title", input.title);
    fd.set("category", input.category);
    if (input.provider) fd.set("provider", input.provider);
    if (input.tags?.length) fd.set("tags", input.tags.join(","));
    if (input.file) fd.set("file", input.file);
    const { data } = await json<{ data: VaultRecord }>(await fetch("/api/vault", { method: "POST", body: fd }));
    return data;
  },

  // URL that streams the stored document inline (image/PDF view, or download).
  fileUrl(id: string): string {
    return `/api/vault/${encodeURIComponent(id)}/file`;
  },

  async remove(id: string): Promise<void> {
    await json<{ ok: boolean }>(await fetch(`/api/vault/${encodeURIComponent(id)}`, { method: "DELETE" }));
  },
};

export type DoseStatus = "taken" | "missed" | "skipped";

export interface AdherenceSummary {
  taken: number;
  missed: number;
  skipped: number;
  adherence: number;
  activeCount: number;
}

export const medsApi = {
  async list(patient?: string): Promise<Medication[]> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: Medication[] }>(await fetch(`/api/medications${qs}`, { cache: "no-store" }));
    return data;
  },

  async summary(patient?: string): Promise<AdherenceSummary> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: AdherenceSummary }>(await fetch(`/api/medications/summary${qs}`, { cache: "no-store" }));
    return data;
  },

  async logDose(id: string, status: DoseStatus): Promise<Medication> {
    const { data } = await json<{ data: Medication }>(
      await fetch(`/api/medications/${encodeURIComponent(id)}/dose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    );
    return data;
  },
};

export interface NewAppointment {
  patient: string;
  doctor: string;
  specialty?: string;
  date: string;
  time: string;
  type: AppointmentType;
}

export const appointmentsApi = {
  async list(patient?: string): Promise<Appointment[]> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: Appointment[] }>(await fetch(`/api/appointments${qs}`, { cache: "no-store" }));
    return data;
  },

  async book(input: NewAppointment): Promise<Appointment> {
    const { data } = await json<{ data: Appointment }>(
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },

  async update(id: string, patch: { status?: "upcoming" | "completed" | "cancelled"; date?: string; time?: string }): Promise<Appointment> {
    const { data } = await json<{ data: Appointment }>(
      await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    );
    return data;
  },
};

export interface GuardianState {
  guardians: Guardian[];
  recovery: RecoveryState;
}

export const guardiansApi = {
  async get(patient?: string): Promise<GuardianState> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: GuardianState }>(await fetch(`/api/guardians${qs}`, { cache: "no-store" }));
    return data;
  },

  async add(input: { patient: string; name: string; relation: string; email: string }): Promise<Guardian> {
    const { data } = await json<{ data: Guardian }>(
      await fetch("/api/guardians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },

  async remove(id: string, patient?: string): Promise<void> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    await json<{ ok: boolean }>(await fetch(`/api/guardians/${encodeURIComponent(id)}${qs}`, { method: "DELETE" }));
  },

  async recovery(action: "approve" | "reset", guardianId?: string, patient?: string): Promise<RecoveryState> {
    const { data } = await json<{ data: RecoveryState }>(
      await fetch("/api/guardians/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, guardianId, patient }),
      })
    );
    return data;
  },
};

export interface NewReminder {
  patient: string;
  type: ReminderType;
  to: string;
  date: string;
  time: string;
  message?: string;
}

export const voiceApi = {
  async list(patient?: string): Promise<{ reminders: VoiceReminder[]; twilioConfigured: boolean }> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: { reminders: VoiceReminder[]; twilioConfigured: boolean } }>(
      await fetch(`/api/voice${qs}`, { cache: "no-store" })
    );
    return data;
  },

  async send(input: NewReminder): Promise<VoiceReminder> {
    const { data } = await json<{ data: VoiceReminder }>(
      await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },
};

export interface TimelineResult {
  events: TimelineEvent[];
  summary: string;
}

export interface NewTimelineEvent {
  patient: string;
  date: string;
  title: string;
  description: string;
  type: TimelineEventType;
}

export const timelineApi = {
  async get(patient?: string): Promise<TimelineResult> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: TimelineResult }>(await fetch(`/api/timeline${qs}`, { cache: "no-store" }));
    return data;
  },

  async add(input: NewTimelineEvent): Promise<TimelineEvent> {
    const { data } = await json<{ data: TimelineEvent }>(
      await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    return data;
  },
};

export type { SafetyReport, DecisionLogEntry } from "@/server/agents/types";

export const safetyApi = {
  async report(patient?: string): Promise<SafetyReport> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: SafetyReport }>(await fetch(`/api/safety/report${qs}`, { cache: "no-store" }));
    return data;
  },

  async scan(patient?: string, allergies?: string[]): Promise<SafetyReport> {
    const { data } = await json<{ data: SafetyReport }>(
      await fetch("/api/safety/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient, allergies, trigger: "manual_scan" }),
      })
    );
    return data;
  },

  async log(patient?: string): Promise<DecisionLogEntry[]> {
    const qs = patient ? `?patient=${encodeURIComponent(patient)}` : "";
    const { data } = await json<{ data: DecisionLogEntry[] }>(await fetch(`/api/safety/log${qs}`, { cache: "no-store" }));
    return data;
  },
};
