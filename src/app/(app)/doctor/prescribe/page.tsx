"use client";

import { useState } from "react";
import { Plus, Trash2, FileSignature, ShieldCheck, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { QR } from "@/components/ui/qr";
import { doctorPatients } from "@/lib/mock-data";
import { useAuth } from "@/lib/store";
import { prescriptionsApi } from "@/lib/api";
import type { Prescription } from "@/lib/types";

interface Med { name: string; dosage: string; frequency: string; duration: string; instructions: string }
const empty: Med = { name: "", dosage: "", frequency: "Once daily", duration: "7 days", instructions: "" };

export default function PrescribePage() {
  const user = useAuth((s) => s.user);
  const [patient, setPatient] = useState(doctorPatients[0].name);
  const [meds, setMeds] = useState<Med[]>([{ ...empty, name: "Metformin", dosage: "500mg" }]);
  const [issued, setIssued] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, key: keyof Med, val: string) =>
    setMeds((m) => m.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));

  const sign = async () => {
    setLoading(true);
    setError(null);
    try {
      const rx = await prescriptionsApi.create({
        patient,
        doctor: user?.name ?? "Unknown Doctor",
        medicines: meds.filter((m) => m.name.trim()),
      });
      setIssued(rx);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to issue prescription.");
    } finally {
      setLoading(false);
    }
  };

  if (issued) {
    return (
      <div>
        <PageHeader title="Prescription Issued" subtitle="Digitally signed, QR-secured, and sent to the patient's vault." />
        <Card className="mx-auto max-w-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary-50 text-primary-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-ink">{issued.code}</h3>
            <p className="text-sm text-ink-soft">for {issued.patient} · signed by {issued.doctor}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Persisted to the patS network · verifiable by any pharmacy
            </p>
            <div className="my-6"><QR value={`https://pats.health/verify/${issued.code}`} size={180} /></div>
            <div className="w-full rounded-2xl bg-bg-secondary p-4 text-left">
              {issued.medicines.map((m, i) => (
                <div key={i} className="flex justify-between border-b border-black/[0.04] py-2 text-sm last:border-0">
                  <span className="font-semibold text-ink">{m.name} {m.dosage}</span>
                  <span className="text-ink-soft">{m.frequency} · {m.duration}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setIssued(null); setMeds([{ ...empty }]); }} className="btn-primary mt-6">
              <Plus className="h-4 w-4" /> New Prescription
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Create Prescription" subtitle="Add medicines, dosage and instructions — patS signs & secures it." />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <label className="label">Patient</label>
          <select value={patient} onChange={(e) => setPatient(e.target.value)} className="input mb-6">
            {doctorPatients.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Medications</h3>
            <button onClick={() => setMeds((m) => [...m, { ...empty }])} className="btn-ghost text-xs"><Plus className="h-3.5 w-3.5" /> Add</button>
          </div>

          <div className="space-y-4">
            {meds.map((m, i) => (
              <div key={i} className="rounded-2xl border border-black/[0.05] bg-bg-secondary/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={m.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Medicine name" className="input" />
                  <input value={m.dosage} onChange={(e) => update(i, "dosage", e.target.value)} placeholder="Dosage (e.g. 500mg)" className="input" />
                  <input value={m.frequency} onChange={(e) => update(i, "frequency", e.target.value)} placeholder="Frequency" className="input" />
                  <input value={m.duration} onChange={(e) => update(i, "duration", e.target.value)} placeholder="Duration" className="input" />
                </div>
                <div className="mt-3 flex gap-3">
                  <input value={m.instructions} onChange={(e) => update(i, "instructions", e.target.value)} placeholder="Instructions (optional)" className="input" />
                  {meds.length > 1 && (
                    <button onClick={() => setMeds((arr) => arr.filter((_, idx) => idx !== i))} className="grid w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
          <button onClick={sign} disabled={!meds.some((m) => m.name) || loading} className="btn-primary mt-4 w-full py-3.5">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Issuing…</> : <><FileSignature className="h-4 w-4" /> Sign & Issue Prescription</>}
          </button>
        </Card>

        <div className="space-y-5">
          <Card className="bg-gradient-to-br from-primary-50 to-white">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-ink"><Sparkles className="h-4 w-4 text-primary-500" /> AI Safety Pre-check</h3>
            <p className="text-sm text-ink-soft">patS scans every prescription against the patient's allergies, current medications and history before issuing.</p>
            <div className="mt-3 rounded-2xl bg-white p-3 text-sm shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Penicillin allergy</span>
                <span className="font-semibold text-primary-600">No conflict</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-ink">What gets generated</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2"><span className="text-primary-500">●</span> Unique prescription ID</li>
              <li className="flex gap-2"><span className="text-primary-500">●</span> Doctor digital signature</li>
              <li className="flex gap-2"><span className="text-primary-500">●</span> Tamper-proof QR code</li>
              <li className="flex gap-2"><span className="text-primary-500">●</span> Auto-delivery to patient vault</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
