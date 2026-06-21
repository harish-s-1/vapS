"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Check, X, Clock, Shield, Stethoscope, Store, Loader2, Ban } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { consentApi, type ConsentDecision } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { ConsentRequest } from "@/lib/types";

export default function ConsentPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";
  const [items, setItems] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    return consentApi.list({ patient }).then(setItems);
  }, [patient]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const decide = async (id: string, decision: ConsentDecision) => {
    setBusy(id);
    try {
      await consentApi.decide(id, decision);
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const pending = items.filter((i) => i.status === "pending");
  const active = items.filter((i) => i.status === "approved");
  const history = items.filter((i) => i.status !== "pending");

  return (
    <div>
      <PageHeader title="Consent & Access Center" subtitle="You decide who sees your records — and for how long." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Clock className="h-5 w-5" />} n={pending.length} l="Pending Requests" tone="bg-amber-50 text-warning" />
        <StatCard icon={<Shield className="h-5 w-5" />} n={active.length} l="Active Grants" tone="bg-primary-50 text-primary-600" />
        <StatCard icon={<Lock className="h-5 w-5" />} n={items.length} l="Total Requests" tone="bg-blue-50 text-info" />
      </div>

      <h3 className="mb-3 text-sm font-bold text-ink-soft">Pending Requests</h3>
      <div className="mb-8 space-y-3">
        {pending.length === 0 && <Card className="text-sm text-ink-soft">No pending requests. You&apos;re all caught up.</Card>}
        {pending.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={r.requester} size={48} />
              <div>
                <div className="flex items-center gap-2 font-bold text-ink">
                  {r.requester}
                  <span className="chip bg-bg-secondary text-ink-soft">
                    {r.requesterRole === "doctor" ? <Stethoscope className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                    {r.requesterRole}
                  </span>
                </div>
                <div className="text-xs text-ink-soft">Requesting: {r.scope} · {formatDate(r.requestedAt)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => decide(r.id, "approved")} disabled={busy === r.id} className="btn-primary">
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
              </button>
              <button onClick={() => decide(r.id, "rejected")} disabled={busy === r.id} className="btn-soft text-danger">
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </Card>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-bold text-ink-soft">Access History</h3>
      <Card className="divide-y divide-black/[0.05] p-0">
        {history.length === 0 && <div className="px-6 py-4 text-sm text-ink-soft">No history yet.</div>}
        {history.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-3">
              <Avatar name={r.requester} size={40} />
              <div>
                <div className="text-sm font-semibold text-ink">{r.requester}</div>
                <div className="text-xs text-ink-soft">
                  {r.scope}
                  {r.expiresAt && r.status === "approved" && ` · expires ${formatDate(r.expiresAt)}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={r.status === "approved" ? "approved" : r.status === "rejected" || r.status === "revoked" ? "rejected" : "expired"}>{r.status}</Badge>
              {r.status === "approved" && (
                <button onClick={() => decide(r.id, "revoked")} disabled={busy === r.id} className="btn-soft text-xs text-danger">
                  {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />} Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function StatCard({ icon, n, l, tone }: { icon: React.ReactNode; n: number; l: string; tone: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold text-ink">{n}</div>
        <div className="text-xs text-ink-soft">{l}</div>
      </div>
    </Card>
  );
}
