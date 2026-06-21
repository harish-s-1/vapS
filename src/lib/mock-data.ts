import type {
  ActivityItem,
  Appointment,
  CallLog,
  ConsentRequest,
  DrugInteraction,
  Guardian,
  Medication,
  Prescription,
  TimelineEvent,
  VaultRecord,
} from "./types";

export const patientProfile = {
  id: "pt_001",
  name: "Ananya Sharma",
  email: "ananya@pats.health",
  role: "patient" as const,
  bloodGroup: "O+",
  age: 32,
  phone: "+91 98765 43210",
  emergencyContacts: [
    { name: "Rohan Sharma", relation: "Spouse", phone: "+91 98765 11111" },
    { name: "Dr. Meera Singh", relation: "Family Physician", phone: "+91 98765 22222" },
  ],
  allergies: ["Penicillin", "Peanuts"],
  chronicConditions: ["Type 2 Diabetes"],
};

export const healthStats = {
  healthScore: 86,
  treatmentScore: 82,
  activeMedications: 5,
  upcomingAppointments: 2,
  healthScoreTrend: [62, 64, 61, 68, 72, 70, 78, 80, 84, 86],
  treatmentTrend: [70, 68, 72, 74, 71, 76, 78, 77, 80, 82],
  adherence: { taken: 82, missed: 12, skipped: 6 },
};

export const activity: ActivityItem[] = [
  { id: "a1", type: "prescription", title: "Prescription Added", meta: "Dr. Rahul Verma", time: "Today, 10:30 AM" },
  { id: "a2", type: "lab", title: "Lab Report Uploaded", meta: "City Diagnostics", time: "Today, 09:15 AM" },
  { id: "a3", type: "medication", title: "Medication Taken", meta: "Paracetamol 500mg", time: "Yesterday, 08:00 AM" },
  { id: "a4", type: "appointment", title: "Appointment Booked", meta: "Dr. Meera Singh", time: "15 May 2025" },
  { id: "a5", type: "access", title: "Access Granted", meta: "Apollo Pharmacy", time: "12 May 2025" },
];

export const medications: Medication[] = [
  { id: "m1", name: "Dolo 650", dosage: "650mg", frequency: "Twice daily", time: "08:00, 20:00", status: "active", adherence: 92, nextDose: "Today, 08:00 PM" },
  { id: "m2", name: "Cold Relief Plus", dosage: "500mg", frequency: "Twice daily", time: "08:00, 20:00", status: "active", adherence: 80, nextDose: "Today, 08:00 PM" },
  { id: "m3", name: "Cetirizine", dosage: "10mg", frequency: "Once daily", time: "21:00", status: "active", adherence: 88, nextDose: "Today, 09:00 PM" },
  { id: "m4", name: "Metformin", dosage: "500mg", frequency: "Twice daily", time: "08:00, 20:00", status: "active", adherence: 92, nextDose: "Today, 08:00 PM" },
  { id: "m5", name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", time: "21:00", status: "active", adherence: 80, nextDose: "Today, 09:00 PM" },
];

export const appointments: Appointment[] = [
  { id: "ap1", doctor: "Dr. Meera Singh", specialty: "Endocrinology", date: "2025-05-16", time: "11:30 AM", type: "Follow-up", status: "upcoming" },
  { id: "ap2", doctor: "Dr. Rahul Verma", specialty: "General Medicine", date: "2025-05-24", time: "04:00 PM", type: "Video", status: "upcoming" },
  { id: "ap3", doctor: "City Diagnostics", specialty: "Pathology", date: "2025-05-02", time: "09:00 AM", type: "Lab Test", status: "completed" },
];

export const vaultRecords: VaultRecord[] = [
  { id: "v1", title: "Diabetes Management Prescription", category: "Prescription", provider: "Dr. Meera Singh", date: "2025-05-12", size: "240 KB", tags: ["Diabetes"] },
  { id: "v2", title: "Complete Blood Count (CBC)", category: "Lab Report", provider: "City Diagnostics", date: "2025-05-02", size: "1.2 MB", tags: ["Routine"] },
  { id: "v3", title: "HbA1c Test Report", category: "Lab Report", provider: "City Diagnostics", date: "2025-04-18", size: "320 KB", tags: ["Diabetes"] },
  { id: "v4", title: "Chest X-Ray", category: "Scan", provider: "Apollo Hospital", date: "2025-03-10", size: "4.8 MB", tags: ["Respiratory"] },
  { id: "v5", title: "Penicillin Allergy", category: "Allergy", provider: "Self-reported", date: "2024-11-20", tags: ["Critical"] },
  { id: "v6", title: "Type 2 Diabetes", category: "Chronic Condition", provider: "Dr. Meera Singh", date: "2024-06-15", tags: ["Ongoing"] },
  { id: "v7", title: "Lipid Profile", category: "Lab Report", provider: "City Diagnostics", date: "2025-01-22", size: "280 KB", tags: ["Cardiac"] },
];

export const prescriptions: Prescription[] = [
  {
    id: "p1",
    code: "VTX-RX-7F3A9B2C",
    patient: "Ananya Sharma",
    doctor: "Dr. Meera Singh",
    date: "2025-05-12",
    status: "active",
    signatureValid: true,
    medicines: [
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals" },
      { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take at night" },
    ],
  },
  {
    id: "p2",
    code: "VTX-RX-2D8E4A11",
    patient: "Ananya Sharma",
    doctor: "Dr. Rahul Verma",
    date: "2025-04-28",
    status: "dispensed",
    signatureValid: true,
    medicines: [{ name: "Paracetamol", dosage: "500mg", frequency: "As needed", duration: "5 days", instructions: "Max 3/day" }],
  },
];

export const consentRequests: ConsentRequest[] = [
  { id: "c1", patient: "Ananya Sharma", requester: "Dr. Arjun Mehta", requesterRole: "doctor", scope: "Full medical history", requestedAt: "2025-05-14", status: "pending" },
  { id: "c2", patient: "Ananya Sharma", requester: "Apollo Pharmacy", requesterRole: "pharmacy", scope: "Active prescriptions", requestedAt: "2025-05-12", expiresAt: "2025-05-19", status: "approved" },
  { id: "c3", patient: "Ananya Sharma", requester: "Dr. Kavya Reddy", requesterRole: "doctor", scope: "Lab reports (last 6 months)", requestedAt: "2025-04-30", expiresAt: "2025-05-07", status: "expired" },
];

export const drugInteractions: DrugInteraction[] = [
  { id: "d1", drugA: "Aspirin", drugB: "Atorvastatin", severity: "moderate", description: "Increased risk of muscle-related side effects when combined.", recommendation: "Monitor for muscle pain. Routine liver function tests advised." },
  { id: "d2", drugA: "Metformin", drugB: "Contrast dye", severity: "high", description: "Risk of lactic acidosis with iodinated contrast media.", recommendation: "Pause Metformin 48h before imaging with contrast." },
];

export const timelineEvents: TimelineEvent[] = [
  { id: "t1", year: "2024", date: "2024-06-15", title: "Type 2 Diabetes Diagnosed", description: "HbA1c 7.8%. Lifestyle counseling initiated.", type: "diagnosis" },
  { id: "t2", year: "2024", date: "2024-06-20", title: "Metformin Started", description: "500mg twice daily prescribed by Dr. Meera Singh.", type: "medication" },
  { id: "t3", year: "2025", date: "2025-01-22", title: "Lipid Profile Reviewed", description: "Atorvastatin added for cholesterol management.", type: "lab" },
  { id: "t4", year: "2025", date: "2025-04-18", title: "Treatment Improving", description: "HbA1c reduced to 6.4%. Adherence at 86%.", type: "improvement" },
  { id: "t5", year: "2025", date: "2025-05-12", title: "Care Plan Updated", description: "Dosage optimized, follow-up scheduled.", type: "medication" },
];

export const guardians: Guardian[] = [
  { id: "g1", name: "Rohan Sharma", relation: "Spouse", email: "rohan@example.com", status: "active" },
  { id: "g2", name: "Sunita Sharma", relation: "Mother", email: "sunita@example.com", status: "active" },
  { id: "g3", name: "Vikram Sharma", relation: "Brother", email: "vikram@example.com", status: "pending" },
];

export const callLogs: CallLog[] = [
  { id: "cl1", type: "Medication", to: "+91 98765 43210", outcome: "Answered", duration: "0:48", date: "Today, 08:05 AM" },
  { id: "cl2", type: "Appointment", to: "+91 98765 43210", outcome: "Voicemail", duration: "0:22", date: "Yesterday, 06:00 PM" },
  { id: "cl3", type: "Follow-up", to: "+91 98765 43210", outcome: "Answered", duration: "1:14", date: "14 May, 10:00 AM" },
  { id: "cl4", type: "Medication", to: "+91 98765 43210", outcome: "No answer", duration: "0:00", date: "13 May, 08:05 AM" },
];

// Doctor view
export const doctorPatients = [
  { id: "dp1", name: "Ananya Sharma", age: 32, condition: "Type 2 Diabetes", lastVisit: "2025-05-12", risk: "low" as const },
  { id: "dp2", name: "Karan Malhotra", age: 54, condition: "Hypertension", lastVisit: "2025-05-10", risk: "moderate" as const },
  { id: "dp3", name: "Priya Nair", age: 41, condition: "Asthma", lastVisit: "2025-05-08", risk: "low" as const },
  { id: "dp4", name: "Sameer Khan", age: 67, condition: "Cardiac, Diabetes", lastVisit: "2025-05-05", risk: "high" as const },
];

// Pharmacy view
export const dispensingHistory = [
  { id: "ph1", code: "VTX-RX-7F3A9B2C", patient: "Ananya Sharma", doctor: "Dr. Meera Singh", date: "2025-05-13", status: "Verified" as const },
  { id: "ph2", code: "VTX-RX-2D8E4A11", patient: "Rahul Gupta", doctor: "Dr. Rahul Verma", date: "2025-05-12", status: "Verified" as const },
  { id: "ph3", code: "VTX-RX-9A1C5E07", patient: "Neha Joshi", doctor: "Unknown", date: "2025-05-11", status: "Rejected" as const },
];

// Admin view
export const adminStats = {
  totalUsers: 12480,
  patients: 9820,
  doctors: 1640,
  pharmacies: 980,
  prescriptionsIssued: 48210,
  securityEvents: 14,
  uptime: "99.98%",
  userGrowth: [320, 410, 480, 560, 620, 740, 880, 960, 1080, 1240, 1360, 1480],
};

export const securityEvents = [
  { id: "se1", event: "Failed login attempt", user: "unknown@mail.com", severity: "moderate" as const, time: "Today, 11:02 AM" },
  { id: "se2", event: "Emergency access granted", user: "Dr. ER Team", severity: "high" as const, time: "Today, 09:40 AM" },
  { id: "se3", event: "Rate limit triggered", user: "203.0.113.8", severity: "low" as const, time: "Yesterday, 10:15 PM" },
  { id: "se4", event: "Guardian recovery initiated", user: "pt_001", severity: "high" as const, time: "14 May, 02:30 PM" },
];
