"use client";

import { TrendingUp, Users, FileText, Activity } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { Bars, Sparkline, Donut } from "@/components/ui/charts";
import { adminStats } from "@/lib/mock-data";

export default function Analytics() {
  return (
    <div>
      <PageHeader title="Platform Analytics" subtitle="Engagement, growth and adoption across the network." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-ink">Prescriptions Issued (12 months)</h3>
          <Bars data={[120, 160, 210, 260, 320, 380, 420, 470, 520, 580, 640, 720]} color="#22C55E" height={200} />
        </Card>
        <Card>
          <h3 className="mb-4 text-base font-bold text-ink">User Distribution</h3>
          <div className="flex flex-col items-center">
            <Donut value={79} label="79%" sublabel="Patients" />
            <div className="mt-4 w-full space-y-2 text-sm">
              <Row c="#4CAF50" l="Patients" v="79%" />
              <Row c="#60A5FA" l="Doctors" v="13%" />
              <Row c="#F59E0B" l="Pharmacies" v="8%" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Users className="h-5 w-5" />} l="Daily Active Users" v="3,240" trend={[20,24,22,28,30,34,38]} />
        <Metric icon={<FileText className="h-5 w-5" />} l="Avg. Rx / Doctor" v="29.4" trend={[18,20,22,24,26,28,29]} />
        <Metric icon={<TrendingUp className="h-5 w-5" />} l="Adherence Rate" v="84%" trend={[70,72,75,78,80,82,84]} />
        <Metric icon={<Activity className="h-5 w-5" />} l="Verification Rate" v="97.2%" trend={[90,92,93,95,96,97,97]} />
      </div>
    </div>
  );
}

function Row({ c, l, v }: { c: string; l: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-ink-soft"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {l}</span><span className="font-bold text-ink">{v}</span></div>;
}
function Metric({ icon, l, v, trend }: { icon: React.ReactNode; l: string; v: string; trend: number[] }) {
  return (
    <Card>
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-primary-50 text-primary-600">{icon}</div>
      <div className="text-2xl font-extrabold text-ink">{v}</div>
      <div className="mb-2 text-xs text-ink-soft">{l}</div>
      <Sparkline data={trend} width={140} height={36} />
    </Card>
  );
}
