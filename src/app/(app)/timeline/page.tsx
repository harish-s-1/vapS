"use client";

import { useCallback, useEffect, useState } from "react";
import { Stethoscope, Pill, TrendingUp, Activity, FlaskConical, Sparkles, Plus, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { timelineApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

const typeCfg: Record<TimelineEventType, { icon: typeof Stethoscope; tone: string; ring: string }> = {
  diagnosis: { icon: Stethoscope, tone: "bg-red-50 text-danger", ring: "ring-red-100" },
  medication: { icon: Pill, tone: "bg-primary-50 text-primary-600", ring: "ring-primary-100" },
  improvement: { icon: TrendingUp, tone: "bg-emerald-50 text-emerald", ring: "ring-emerald-100" },
  procedure: { icon: Activity, tone: "bg-blue-50 text-info", ring: "ring-blue-100" },
  lab: { icon: FlaskConical, tone: "bg-amber-50 text-warning", ring: "ring-amber-100" },
};
const TYPES: TimelineEventType[] = ["diagnosis", "medication", "improvement", "procedure", "lab"];

export default function TimelinePage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TimelineEventType>("lab");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () => timelineApi.get(patient).then((r) => { setEvents(r.events); setSummary(r.summary); }),
    [patient]
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const add = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      await timelineApi.add({ patient, date, title, description, type });
      setShowAdd(false); setDate(""); setTitle(""); setDescription(""); setType("lab");
      await load(); // summary regenerates from the new event set
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="AI Health Timeline"
        subtitle="Your complete health journey, generated and narrated by AI."
        action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary"><Plus className="h-4 w-4" /> Add Event</button>}
      />

      {showAdd && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Add a health event</h3>
            <button onClick={() => setShowAdd(false)} className="text-ink-soft hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HbA1c improved to 6.1%" className="input" /></div>
            <div><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
            <div>
              <label className="label">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as TimelineEventType)} className="input capitalize">
                {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div><label className="label">Description</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note" className="input" /></div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={add} disabled={!title.trim() || !date || saving} className="btn-primary">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add to Timeline</>}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-soft">Cancel</button>
          </div>
        </Card>
      )}

      <Card className="mb-6 bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
          <div>
            <h3 className="font-bold text-ink">AI Summary</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{summary}</p>
          </div>
        </div>
      </Card>

      <div className="relative ml-2 border-l-2 border-dashed border-primary-200 pl-8">
        {events.map((e) => {
          const cfg = typeCfg[e.type];
          const Icon = cfg.icon;
          return (
            <div key={e.id} className="relative mb-8 last:mb-0">
              <div className={`absolute -left-[42px] grid h-9 w-9 place-items-center rounded-full bg-white ring-4 ${cfg.ring}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-full ${cfg.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-600">{e.year}</span>
                  <span className="text-xs text-ink-soft">{formatDate(e.date)}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-ink">{e.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{e.description}</p>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
