"use client";

import { ShieldAlert, ShieldCheck, Lock, Eye } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, StatIcon } from "@/components/ui/primitives";
import { securityEvents } from "@/lib/mock-data";

const more = [
  ...securityEvents,
  { id: "se5", event: "New device login", user: "ananya@pats.health", severity: "low" as const, time: "13 May, 08:00 AM" },
  { id: "se6", event: "Consent revoked by patient", user: "pt_001", severity: "moderate" as const, time: "12 May, 04:20 PM" },
  { id: "se7", event: "Audit log exported", user: "admin@pats.health", severity: "low" as const, time: "11 May, 09:00 AM" },
];

export default function Security() {
  return (
    <div>
      <PageHeader title="Security Events" subtitle="Audit trail of authentication, access and system security events." />

      <div className="mb-5 grid gap-5 sm:grid-cols-3">
        <Card className="flex items-center gap-3"><StatIcon tone="primary"><ShieldCheck className="h-5 w-5" /></StatIcon><div><div className="text-2xl font-extrabold text-ink">99.98%</div><div className="text-xs text-ink-soft">Auth success</div></div></Card>
        <Card className="flex items-center gap-3"><StatIcon tone="amber"><ShieldAlert className="h-5 w-5" /></StatIcon><div><div className="text-2xl font-extrabold text-ink">{more.filter(e=>e.severity==="high").length}</div><div className="text-xs text-ink-soft">High-severity</div></div></Card>
        <Card className="flex items-center gap-3"><StatIcon tone="blue"><Lock className="h-5 w-5" /></StatIcon><div><div className="text-2xl font-extrabold text-ink">AES-256</div><div className="text-xs text-ink-soft">Encryption at rest</div></div></Card>
      </div>

      <Card className="divide-y divide-black/[0.05] p-0">
        {more.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-bg-secondary text-ink-soft"><Eye className="h-5 w-5" /></div>
              <div><div className="text-sm font-semibold text-ink">{e.event}</div><div className="text-xs text-ink-soft">{e.user} · {e.time}</div></div>
            </div>
            <Badge tone={e.severity}>{e.severity}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
