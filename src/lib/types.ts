export type Role = "patient" | "doctor" | "pharmacy" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  bloodGroup?: string;
}

export type Severity = "low" | "moderate" | "high" | "critical";

export type VaultCategory = "Prescription" | "Lab Report" | "Scan" | "Allergy" | "Chronic Condition" | "Report";

export interface VaultRecord {
  id: string;
  patient?: string;
  title: string;
  category: VaultCategory;
  provider: string;
  date: string;
  size?: string;
  tags?: string[];
  hasFile?: boolean;   // an actual document is stored and viewable
  mime?: string;       // content type of the stored file
  fileName?: string;   // original uploaded filename
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  status: "active" | "completed" | "paused";
  adherence: number;
  nextDose?: string;
}

export type AppointmentType = "In-person" | "Video" | "Lab Test" | "Follow-up";

export interface Appointment {
  id: string;
  patient?: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: "upcoming" | "completed" | "cancelled";
}

export interface Prescription {
  id: string;
  code: string;
  patient: string;
  doctor: string;
  date: string;
  status: "active" | "dispensed" | "expired";
  medicines: { name: string; dosage: string; frequency: string; duration: string; instructions?: string }[];
  signatureValid: boolean;
}

export interface ConsentRequest {
  id: string;
  patient: string;
  requester: string;
  requesterRole: Role;
  scope: string;
  requestedAt: string;
  expiresAt?: string;
  status: "pending" | "approved" | "rejected" | "expired" | "revoked";
}

export interface ActivityItem {
  id: string;
  type: "prescription" | "lab" | "medication" | "appointment" | "access" | "security";
  title: string;
  meta: string;
  time: string;
}

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: Severity;
  description: string;
  recommendation: string;
}

export type TimelineEventType = "diagnosis" | "medication" | "improvement" | "procedure" | "lab";

export interface TimelineEvent {
  id: string;
  patient?: string;
  year: string;
  date: string;
  title: string;
  description: string;
  type: TimelineEventType;
}

export interface Guardian {
  id: string;
  patient?: string;
  name: string;
  relation: string;
  email: string;
  status: "active" | "pending";
}

export interface RecoveryState {
  threshold: number;
  approvals: string[]; // guardian ids that have approved
  status: "pending" | "completed";
}

export interface CallLog {
  id: string;
  type: "Medication" | "Appointment" | "Follow-up";
  to: string;
  outcome: "Answered" | "Voicemail" | "No answer";
  duration: string;
  date: string;
}

export type ReminderType = "Medication" | "Appointment" | "Follow-up";
export type ReminderStatus = "Sent" | "Scheduled" | "Failed" | "Simulated";

export interface VoiceReminder {
  id: string;
  patient?: string;
  type: ReminderType;
  to: string;
  message: string;
  status: ReminderStatus;
  scheduledFor?: string; // ISO timestamp the reminder is due
  providerId?: string; // Twilio message SID
  error?: string;
  date: string; // when this reminder was created (display)
}
