"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneCall, Pill, CalendarDays, Repeat, MessageSquare, Send, Loader2, CheckCircle2, Clock, XCircle, FlaskConical, Info, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { voiceApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { patientProfile } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";
import type { ReminderType, VoiceReminder } from "@/lib/types";

const types: { id: ReminderType; icon: typeof Pill }[] = [
  { id: "Medication", icon: Pill },
  { id: "Appointment", icon: CalendarDays },
  { id: "Follow-up", icon: Repeat },
];

const statusCfg: Record<VoiceReminder["status"], { icon: typeof CheckCircle2; tone: "active" | "pending" | "rejected" | "expired" }> = {
  Sent: { icon: CheckCircle2, tone: "active" },
  Scheduled: { icon: Clock, tone: "pending" },
  Failed: { icon: XCircle, tone: "rejected" },
  Simulated: { icon: FlaskConical, tone: "expired" },
};

export default function VoicePage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [reminders, setReminders] = useState<VoiceReminder[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<ReminderType>("Medication");
  const [to, setTo] = useState(patientProfile.phone ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState<VoiceReminder | null>(null);

  const load = useCallback(
    () => voiceApi.list(patient).then((d) => { setReminders(d.reminders); setConfigured(d.twilioConfigured); }),
    [patient]
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const send = async () => {
    setError(null);
    setJustSent(null);
    if (!to.trim() || !date || !time) {
      setError("Enter a phone number, date and time.");
      return;
    }
    setSending(true);
    try {
      const r = await voiceApi.send({ patient, type, to, date, time, message: message || undefined });
      setJustSent(r);
      setMessage("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reminder.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI Voice & SMS Assistant" subtitle="Automated medication, appointment & follow-up reminders via Twilio." />

      {/* Twilio status */}
      <Card className={cn("mb-6 flex items-center gap-3", configured ? "bg-primary-50/50" : "bg-amber-50/50")}>
        {configured ? <ShieldCheck className="h-5 w-5 text-primary-500" /> : <Info className="h-5 w-5 text-warning" />}
        <div className="text-sm">
          {configured ? (
            <span className="font-semibold text-primary-700">Twilio connected — reminders send as real SMS messages.</span>
          ) : (
            <span className="text-ink">
              <b className="text-warning">Demo mode.</b> Set <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs">TWILIO_ACCOUNT_SID</code>, <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs">TWILIO_AUTH_TOKEN</code> & <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs">TWILIO_FROM_NUMBER</code> to send real SMS. Reminders are logged below.
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Compose form */}
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink"><MessageSquare className="h-4 w-4 text-primary-500" /> Send a Reminder</h3>

          <label className="label">Reminder type</label>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border border-black/[0.05] px-2 py-3 text-xs font-semibold transition",
                  type === t.id ? "border-primary-300 bg-primary-50 text-primary-700 shadow-glow" : "bg-white text-ink-soft hover:bg-bg-secondary"
                )}
              >
                <t.icon className="h-5 w-5" /> {t.id}
              </button>
            ))}
          </div>

          <label className="label">Phone number</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+91 98765 43210" className="input mb-4" />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
            <div><label className="label">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" /></div>
          </div>

          <label className="label">Message <span className="font-normal text-ink-soft">(optional — auto-generated if blank)</span></label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Custom reminder message…" className="input mb-4 resize-none" />

          {error && <div className="mb-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-danger">{error}</div>}
          {justSent && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2.5 text-sm text-primary-700">
              <CheckCircle2 className="h-4 w-4" />
              {justSent.status === "Sent" && "SMS sent successfully."}
              {justSent.status === "Scheduled" && "Reminder scheduled with Twilio."}
              {justSent.status === "Simulated" && "Reminder simulated (demo mode) & logged."}
              {justSent.status === "Failed" && `Failed: ${justSent.error}`}
            </div>
          )}

          <button onClick={send} disabled={sending} className="btn-primary w-full py-3.5">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> {configured ? "Send SMS Reminder" : "Send (Demo)"}</>}
          </button>
        </Card>

        {/* Log */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-soft">Reminder Log</h3>
            <span className="text-xs text-ink-soft">{reminders.length} reminders</span>
          </div>
          {loading ? (
            <Card className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></Card>
          ) : reminders.length === 0 ? (
            <Card className="text-sm text-ink-soft">No reminders yet. Send your first one using the form.</Card>
          ) : (
            <Card className="divide-y divide-black/[0.05] p-0">
              {reminders.map((r) => {
                const cfg = statusCfg[r.status];
                const Icon = cfg.icon;
                const TypeIcon = types.find((t) => t.id === r.type)?.icon ?? PhoneCall;
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-bg-secondary text-ink-soft"><TypeIcon className="h-5 w-5" /></div>
                        <div>
                          <div className="text-sm font-semibold text-ink">{r.type} Reminder</div>
                          <div className="text-xs text-ink-soft">
                            {r.to} · {r.scheduledFor ? `for ${new Date(r.scheduledFor).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : formatDate(r.date)}
                          </div>
                        </div>
                      </div>
                      <Badge tone={cfg.tone}><Icon className="h-3.5 w-3.5" /> {r.status}</Badge>
                    </div>
                    <p className="mt-2 rounded-xl bg-bg-secondary/60 px-3 py-2 text-xs text-ink-soft">{r.message}</p>
                    {r.error && <p className="mt-1 text-xs text-danger">{r.error}</p>}
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
