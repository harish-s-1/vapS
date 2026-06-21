"use client";

import { ShieldAlert, Zap, AlertTriangle, Pill } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { drugInteractions } from "@/lib/mock-data";

const extra = [
  { id: "x1", drugA: "Karan Malhotra", drugB: "BP trending up", severity: "moderate" as const, description: "Systolic BP rose 12mmHg over 3 readings.", recommendation: "Review antihypertensive dose at next visit." },
  { id: "x2", drugA: "Sameer Khan", drugB: "Missed 4 doses", severity: "high" as const, description: "Cardiac medication adherence dropped to 61%.", recommendation: "Enable voice reminders; consider caregiver involvement." },
];

export default function AlertsPage() {
  const all = [...drugInteractions, ...extra];
  return (
    <div>
      <PageHeader title="Risk Alerts" subtitle="AI-surfaced clinical risks across your patient panel." />
      <div className="grid gap-4 md:grid-cols-2">
        {all.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-warning">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-ink">{a.drugA} <span className="text-ink-soft">·</span> {a.drugB}</div>
                  <div className="text-xs text-ink-soft">{a.description}</div>
                </div>
              </div>
              <Badge tone={a.severity}>{a.severity}</Badge>
            </div>
            <div className="mt-3 rounded-2xl bg-bg-secondary px-4 py-2.5 text-sm text-ink">
              <b>Action:</b> {a.recommendation}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
