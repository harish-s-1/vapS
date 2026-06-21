"use client";

import Link from "next/link";
import { Users, FileText, ShieldAlert, Brain, ArrowRight, TrendingUp, Activity } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar, StatIcon } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";
import { doctorPatients, drugInteractions } from "@/lib/mock-data";
import { useAuth } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function DoctorDashboard() {
  const user = useAuth((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-soft">Welcome back,</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{user?.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">Here's your clinical overview for today.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} tone="primary" n={doctorPatients.length} l="Active Patients" trend={[10, 12, 11, 14, 16, 18, 20]} />
        <StatCard icon={<FileText className="h-5 w-5" />} tone="blue" n={128} l="Prescriptions" trend={[40, 44, 50, 48, 60, 70, 80]} c="#60A5FA" />
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} tone="amber" n={drugInteractions.length} l="Risk Alerts" trend={[3, 2, 4, 3, 2, 3, 2]} c="#F59E0B" />
        <StatCard icon={<Brain className="h-5 w-5" />} tone="emerald" n={14} l="AI Recommendations" trend={[5, 6, 8, 7, 10, 12, 14]} c="#22C55E" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">My Patients</h3>
            <Link href="/doctor/patients" className="text-xs font-semibold text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {doctorPatients.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size={42} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{p.name} <span className="text-ink-soft">· {p.age}y</span></div>
                    <div className="text-xs text-ink-soft">{p.condition} · last visit {formatDate(p.lastVisit)}</div>
                  </div>
                </div>
                <Badge tone={p.risk === "high" ? "high" : p.risk === "moderate" ? "moderate" : "low"}>{p.risk} risk</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-amber-50/40">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><Brain className="h-5 w-5 text-primary-500" /> AI Recommendations</h3>
          <div className="space-y-3">
            {drugInteractions.map((d) => (
              <div key={d.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{d.drugA} + {d.drugB}</span>
                  <Badge tone={d.severity}>{d.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{d.recommendation}</p>
              </div>
            ))}
          </div>
          <Link href="/doctor/safety" className="btn-ghost mt-4 w-full">Open Safety Engine <ArrowRight className="h-4 w-4" /></Link>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, tone, n, l, trend, c }: { icon: React.ReactNode; tone: "primary" | "blue" | "amber" | "emerald"; n: number; l: string; trend: number[]; c?: string }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <div className="mb-2"><StatIcon tone={tone}>{icon}</StatIcon></div>
        <div className="text-3xl font-extrabold text-ink">{n}</div>
        <div className="text-xs text-ink-soft">{l}</div>
      </div>
      <Sparkline data={trend} color={c} />
    </Card>
  );
}
