"use client";

import Link from "next/link";
import { Users, Stethoscope, Store, FileText, ShieldAlert, Activity, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, StatIcon } from "@/components/ui/primitives";
import { Bars, Sparkline } from "@/components/ui/charts";
import { adminStats, securityEvents } from "@/lib/mock-data";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Console" subtitle="Platform-wide users, analytics, security & system health." />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} tone="primary" n={adminStats.totalUsers.toLocaleString()} l="Total Users" trend={[8,9,10,11,12,12,13]} />
        <Stat icon={<Stethoscope className="h-5 w-5" />} tone="blue" n={adminStats.doctors.toLocaleString()} l="Doctors" trend={[3,4,4,5,6,6,7]} c="#60A5FA" />
        <Stat icon={<FileText className="h-5 w-5" />} tone="emerald" n={adminStats.prescriptionsIssued.toLocaleString()} l="Prescriptions" trend={[20,28,34,40,44,48,50]} c="#22C55E" />
        <Stat icon={<ShieldAlert className="h-5 w-5" />} tone="amber" n={adminStats.securityEvents} l="Security Events" trend={[5,3,4,2,3,2,1]} c="#F59E0B" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">User Growth (12 months)</h3>
            <Badge tone="active">+18% MoM</Badge>
          </div>
          <Bars data={adminStats.userGrowth} height={180} />
          <div className="mt-2 flex justify-between text-xs text-ink-soft">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Security Events</h3>
            <Link href="/admin/security" className="text-xs font-semibold text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {securityEvents.slice(0, 4).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl bg-bg-secondary px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold text-ink">{e.event}</div>
                  <div className="text-xs text-ink-soft">{e.time}</div>
                </div>
                <Badge tone={e.severity}>{e.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={<Users className="h-5 w-5" />} n={adminStats.patients.toLocaleString()} l="Patients" />
        <Mini icon={<Store className="h-5 w-5" />} n={adminStats.pharmacies.toLocaleString()} l="Pharmacies" />
        <Mini icon={<Activity className="h-5 w-5" />} n={adminStats.uptime} l="Uptime" />
        <Link href="/admin/analytics"><Mini icon={<ArrowRight className="h-5 w-5" />} n="Analytics" l="Deep dive" /></Link>
      </div>
    </div>
  );
}

function Stat({ icon, tone, n, l, trend, c }: { icon: React.ReactNode; tone: "primary"|"blue"|"amber"|"emerald"; n: string|number; l: string; trend: number[]; c?: string }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <div className="mb-2"><StatIcon tone={tone}>{icon}</StatIcon></div>
        <div className="text-2xl font-extrabold text-ink">{n}</div>
        <div className="text-xs text-ink-soft">{l}</div>
      </div>
      <Sparkline data={trend} color={c} />
    </Card>
  );
}

function Mini({ icon, n, l }: { icon: React.ReactNode; n: string; l: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-600">{icon}</div>
      <div><div className="font-bold text-ink">{n}</div><div className="text-xs text-ink-soft">{l}</div></div>
    </Card>
  );
}
