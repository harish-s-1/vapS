"use client";

import { Bot, Pill, CalendarDays, FlaskConical, Repeat, Bell, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { medications, appointments } from "@/lib/mock-data";

const tasks = [
  { icon: Pill, tone: "bg-primary-50 text-primary-600", title: "Take Metformin 500mg", time: "Today, 08:00 PM", done: false },
  { icon: Pill, tone: "bg-primary-50 text-primary-600", title: "Take Vitamin D3", time: "Today, 08:00 AM", done: true },
  { icon: CalendarDays, tone: "bg-blue-50 text-info", title: "Follow-up: Dr. Meera Singh", time: "16 May, 11:30 AM", done: false },
  { icon: FlaskConical, tone: "bg-emerald-50 text-emerald", title: "HbA1c Lab Test", time: "20 May, 09:00 AM", done: false },
  { icon: Repeat, tone: "bg-amber-50 text-warning", title: "Refill Atorvastatin", time: "25 May", done: false },
];

export default function CarePage() {
  return (
    <div>
      <PageHeader title="AI Care Coordinator" subtitle="Your intelligent assistant for appointments, follow-ups, labs & medication schedules." />

      <Card className="mb-6 bg-gradient-to-br from-primary-50 to-sage/40">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white shadow-soft">
            <Bot className="h-9 w-9 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">Good morning, Ananya 👋</h3>
            <p className="mt-1 text-sm text-ink-soft">
              You have <b className="text-ink">2 medications</b> due today, <b className="text-ink">1 follow-up</b> this week, and a
              lab test coming up. I've already scheduled reminders for everything. Want me to call you for the evening dose?
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary text-xs"><Bell className="h-3.5 w-3.5" /> Enable smart reminders</button>
              <button className="btn-soft text-xs">Adjust schedule</button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-soft">Today's Plan & Upcoming</h3>
          <Card className="space-y-2 p-4">
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-bg-secondary">
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${t.tone}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${t.done ? "text-ink-soft line-through" : "text-ink"}`}>{t.title}</div>
                  <div className="text-xs text-ink-soft">{t.time}</div>
                </div>
                <CheckCircle2 className={`h-5 w-5 ${t.done ? "text-primary-500" : "text-ink-soft/30"}`} />
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-bold text-ink">Auto-Created Reminders</h3>
            <div className="space-y-2 text-sm">
              {medications.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-bg-secondary px-3 py-2">
                  <span className="text-ink">{m.name}</span>
                  <span className="text-xs text-ink-soft">{m.time}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="mb-3 text-sm font-bold text-ink">Coordination Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat n={medications.length} l="Meds" />
              <Stat n={appointments.filter((a) => a.status === "upcoming").length} l="Visits" />
              <Stat n={3} l="Reminders" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl bg-bg-secondary py-4">
      <div className="text-2xl font-extrabold text-primary-600">{n}</div>
      <div className="text-xs text-ink-soft">{l}</div>
    </div>
  );
}
