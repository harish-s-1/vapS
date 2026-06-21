"use client";

import { useCallback, useEffect, useState } from "react";
import { Video, MapPin, FlaskConical, Repeat, Calendar, Clock, Plus, X, Loader2, Ban } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { appointmentsApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentType } from "@/lib/types";

const typeIcon: Record<AppointmentType, { icon: typeof Video; tone: string }> = {
  Video: { icon: Video, tone: "bg-blue-50 text-info" },
  "In-person": { icon: MapPin, tone: "bg-primary-50 text-primary-600" },
  "Lab Test": { icon: FlaskConical, tone: "bg-emerald-50 text-emerald" },
  "Follow-up": { icon: Repeat, tone: "bg-amber-50 text-warning" },
};
const TYPES: AppointmentType[] = ["In-person", "Video", "Lab Test", "Follow-up"];

export default function AppointmentsPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [showBook, setShowBook] = useState(false);
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<AppointmentType>("In-person");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => appointmentsApi.list(patient).then(setItems), [patient]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const book = async () => {
    if (!doctor.trim() || !date || !time) return;
    setSaving(true);
    try {
      // convert 24h <input type=time> to a friendly label
      const label = new Date(`1970-01-01T${time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      await appointmentsApi.book({ patient, doctor, specialty, date, time: label, type });
      setShowBook(false);
      setDoctor(""); setSpecialty(""); setDate(""); setTime(""); setType("In-person");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await appointmentsApi.update(id, { status: "cancelled" });
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  const upcoming = items.filter((a) => a.status === "upcoming");
  const past = items.filter((a) => a.status !== "upcoming");

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Your upcoming visits, follow-ups, and lab tests."
        action={<button onClick={() => setShowBook((s) => !s)} className="btn-primary"><Plus className="h-4 w-4" /> Book Appointment</button>}
      />

      {showBook && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Book an appointment</h3>
            <button onClick={() => setShowBook(false)} className="text-ink-soft hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Doctor / Facility</label><input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="e.g. Dr. Meera Singh" className="input" /></div>
            <div><label className="label">Specialty</label><input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Endocrinology" className="input" /></div>
            <div><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
            <div><label className="label">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
            <div className="sm:col-span-2">
              <label className="label">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AppointmentType)} className="input">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={book} disabled={!doctor.trim() || !date || !time || saving} className="btn-primary">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <><Plus className="h-4 w-4" /> Confirm Booking</>}
            </button>
            <button onClick={() => setShowBook(false)} className="btn-soft">Cancel</button>
          </div>
        </Card>
      )}

      <h3 className="mb-3 text-sm font-bold text-ink-soft">Upcoming ({upcoming.length})</h3>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {upcoming.length === 0 && <Card className="text-sm text-ink-soft">No upcoming appointments. Book one above.</Card>}
        {upcoming.map((a) => {
          const cfg = typeIcon[a.type];
          const Icon = cfg.icon;
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={a.doctor} size={48} />
                  <div>
                    <div className="font-bold text-ink">{a.doctor}</div>
                    <div className="text-xs text-ink-soft">{a.specialty}</div>
                  </div>
                </div>
                <span className={`chip ${cfg.tone}`}><Icon className="h-3.5 w-3.5" /> {a.type}</span>
              </div>
              <div className="mt-4 flex items-center gap-5 rounded-2xl bg-bg-secondary px-4 py-3 text-sm text-ink">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary-500" /> {formatDate(a.date)}</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary-500" /> {a.time}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-primary flex-1">{a.type === "Video" ? "Join Call" : "View Details"}</button>
                <button onClick={() => cancel(a.id)} disabled={busy === a.id} className="btn-soft text-danger">
                  {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Cancel
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <h3 className="mb-3 text-sm font-bold text-ink-soft">Past & Cancelled</h3>
      <Card className="divide-y divide-black/[0.05] p-0">
        {past.length === 0 && <div className="px-6 py-4 text-sm text-ink-soft">Nothing here yet.</div>}
        {past.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Avatar name={a.doctor} size={40} />
              <div>
                <div className="text-sm font-semibold text-ink">{a.doctor}</div>
                <div className="text-xs text-ink-soft">{a.specialty} · {formatDate(a.date)}</div>
              </div>
            </div>
            <Badge tone={a.status === "completed" ? "approved" : "rejected"}>{a.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
