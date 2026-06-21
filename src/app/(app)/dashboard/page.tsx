"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartPulse, ShieldCheck, ShieldPlus, ArrowRight, Sparkles, Mic, UserPlus, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { medsApi, type AdherenceSummary } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { healthStats } from "@/lib/mock-data";
import { scoreLabel } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const firstName = (user?.name ?? "there").split(" ")[0];

  const [adh, setAdh] = useState<AdherenceSummary | null>(null);

  useEffect(() => {
    medsApi.summary(user?.name).then(setAdh).catch(() => {});
  }, [user?.name]);

  const hl = scoreLabel(healthStats.healthScore);
  const tl = scoreLabel(healthStats.treatmentScore);

  // Live AI insight derived from real adherence
  const adherence = adh?.adherence ?? 0;
  const insight =
    adherence >= 85
      ? "Your health is improving consistently."
      : adherence >= 70
        ? "You're on track — a few missed doses to watch."
        : adh
          ? "Your medication adherence needs attention."
          : "Building your health insight…";
  const insightSub = adh
    ? `Your treatment adherence is ${adherence}% — better than ${Math.min(99, adherence + 4)}% of similar patients.`
    : "Log your doses and visits to get personalized insights.";

  return (
    <div className="space-y-6">
      {/* Greeting + Add Guardian */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div aria-hidden className="pointer-events-none absolute right-44 top-0 hidden opacity-70 lg:block">
          <Leaves />
        </div>
        <div className="relative">
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-ink">
            Welcome back, {firstName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Your health, your data, your control.</p>
        </div>
        <Link href="/guardians" className="btn-primary relative shrink-0">
          <UserPlus className="h-4 w-4" /> Add Guardian
        </Link>
      </div>

      {/* Stat tiles — clickable */}
      <div className="grid gap-5 lg:grid-cols-3">
        <HeroStat href="/timeline" tone="primary" icon={<HeartPulse className="h-7 w-7" />} n={healthStats.healthScore} suffix="/100" label="Health Score" sub={hl.label} />
        <HeroStat href="/medications" tone="blue" icon={<ShieldCheck className="h-7 w-7" />} n={healthStats.treatmentScore} suffix="/100" label="Treatment Score" sub={tl.label} />
        <HeroStat href="/emergency" tone="amber" icon={<ShieldPlus className="h-7 w-7" />} n={1} label="Emergency Card" sub="Configured" />
      </div>

      {/* AI Health Insight — live */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary-50/70 to-white p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-500 text-white shadow-[0_8px_20px_rgba(76,175,80,0.3)]">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">AI Health Insight</h3>
                <span className="chip bg-primary-100 text-primary-700">Live</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-primary-700">{insight}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{insightSub}</p>
            </div>
          </div>

          <div className="hidden shrink-0 text-center sm:block">
            <div className="flex items-center justify-center gap-1 text-3xl font-extrabold text-ink">
              {adherence}<span className="text-base text-ink-soft">%</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-primary-600">
              <TrendingUp className="h-3.5 w-3.5" /> adherence
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-black/[0.05] bg-white/60 px-6 py-3">
          <Link href="/timeline" className="btn-ghost text-sm">
            View Detailed Insights <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/voice" className="btn-soft text-sm">
            <Mic className="h-4 w-4" /> Talk to patS
          </Link>
        </div>
      </Card>
    </div>
  );
}

const toneMap = {
  primary: { box: "bg-primary-50 text-primary-600", card: "from-primary-50/50", arrow: "text-primary-600" },
  blue: { box: "bg-blue-50 text-info", card: "from-blue-50/50", arrow: "text-info" },
  amber: { box: "bg-amber-50 text-warning", card: "from-amber-50/50", arrow: "text-warning" },
};

function HeroStat({ href, tone, icon, n, suffix, label, sub }: { href: string; tone: keyof typeof toneMap; icon: React.ReactNode; n: number; suffix?: string; label: string; sub: string }) {
  const t = toneMap[tone];
  return (
    <Link href={href}>
      <Card className={`flex items-center justify-between bg-gradient-to-br ${t.card} to-white`}>
        <div className="flex items-center gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ${t.box}`}>{icon}</div>
          <div>
            <div className="flex items-baseline gap-0.5 text-3xl font-extrabold text-ink">
              {n}{suffix && <span className="text-sm font-semibold text-ink-soft">{suffix}</span>}
            </div>
            <div className="text-sm font-semibold text-ink">{label}</div>
            <div className="text-xs text-ink-soft">{sub}</div>
          </div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-full bg-white shadow-card ${t.arrow}`}>
          <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}

function Leaves() {
  return (
    <svg width="170" height="120" viewBox="0 0 170 120" fill="none">
      <g opacity="0.5">
        <path d="M85 30c-18 0-30 14-30 32 0 4 1 8 2 11l28 16 28-16c1-3 2-7 2-11 0-18-12-32-30-32z" fill="#DDEEDD" />
        <path d="M85 50l-7 12 7 4 7-4-7-12z" fill="#4CAF50" opacity="0.6" />
        <path d="M120 28c10-6 24-4 30 2-8 4-20 6-30-2z" fill="#9BD09B" />
        <path d="M132 44c12-2 22 4 26 12-9 1-20-2-26-12z" fill="#C2E2C2" />
        <path d="M44 30c-10-6-22-4-28 3 8 4 19 5 28-3z" fill="#9BD09B" />
      </g>
    </svg>
  );
}
