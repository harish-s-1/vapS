"use client";

import { Server, Database, Cloud, Cpu, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";

const services = [
  { name: "API Gateway (FastAPI)", status: "Operational", uptime: "99.99%", icon: Server },
  { name: "PostgreSQL (Supabase)", status: "Operational", uptime: "99.97%", icon: Database },
  { name: "Object Storage", status: "Operational", uptime: "100%", icon: Cloud },
  { name: "AI Engine (Gemini)", status: "Operational", uptime: "99.95%", icon: Cpu },
];

export default function System() {
  return (
    <div>
      <PageHeader title="System Health" subtitle="Live status of patS infrastructure and services." />

      <Card className="mb-5 flex items-center gap-3 bg-primary-50/50">
        <CheckCircle2 className="h-6 w-6 text-primary-500" />
        <span className="font-semibold text-primary-700">All systems operational</span>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <Card key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-600"><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="font-bold text-ink">{s.name}</div>
                <div className="text-xs text-ink-soft">Uptime {s.uptime}</div>
              </div>
            </div>
            <span className="chip bg-primary-50 text-primary-700"><span className="h-2 w-2 rounded-full bg-primary-500" /> {s.status}</span>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-ink">CPU Load</h3>
          <Sparkline data={[30,42,38,50,46,52,48,55,50,47]} width={260} height={70} />
          <div className="mt-3"><ProgressBar value={47} /></div>
          <div className="mt-1 text-xs text-ink-soft">47% average</div>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-bold text-ink">Memory</h3>
          <Sparkline data={[60,62,61,65,64,66,63,67,65,64]} color="#60A5FA" width={260} height={70} />
          <div className="mt-3"><ProgressBar value={64} tone="amber" /></div>
          <div className="mt-1 text-xs text-ink-soft">64% of 16GB</div>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-bold text-ink">API Latency</h3>
          <Sparkline data={[120,110,115,108,112,105,109,103,107,102]} color="#22C55E" width={260} height={70} />
          <div className="mt-3 text-2xl font-extrabold text-ink">102<span className="text-sm font-medium text-ink-soft"> ms p95</span></div>
        </Card>
      </div>
    </div>
  );
}
