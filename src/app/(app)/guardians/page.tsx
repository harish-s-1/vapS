"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Plus, ShieldCheck, KeyRound, Check, X, Trash2, Loader2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { guardiansApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import type { Guardian, RecoveryState } from "@/lib/types";

export default function GuardiansPage() {
  const user = useAuth((s) => s.user);
  const patient = user?.name ?? "Ananya Sharma";

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () => guardiansApi.get(patient).then((s) => { setGuardians(s.guardians); setRecovery(s.recovery); }),
    [patient]
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const add = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await guardiansApi.add({ patient, name, relation, email });
      setShowAdd(false); setName(""); setRelation(""); setEmail("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try { await guardiansApi.remove(id, patient); await load(); } finally { setBusy(null); }
  };

  const approve = async (id: string) => {
    setBusy(id);
    try { setRecovery(await guardiansApi.recovery("approve", id, patient)); } finally { setBusy(null); }
  };

  const reset = async () => {
    setBusy("reset");
    try { setRecovery(await guardiansApi.recovery("reset", undefined, patient)); } finally { setBusy(null); }
  };

  if (loading || !recovery) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  const active = guardians.filter((g) => g.status === "active");
  const approvedCount = recovery.approvals.length;
  const recovered = recovery.status === "completed";

  return (
    <div>
      <PageHeader
        title="Guardian Recovery"
        subtitle="Trusted people who can help you recover access — with threshold approval."
        action={<button onClick={() => setShowAdd((s) => !s)} className="btn-primary"><Plus className="h-4 w-4" /> Add Guardian</button>}
      />

      {showAdd && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Add a guardian</h3>
            <button onClick={() => setShowAdd(false)} className="text-ink-soft hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
            <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation (e.g. Sister)" className="input" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={add} disabled={!name.trim() || !email.trim() || saving} className="btn-primary">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add Guardian</>}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-soft">Cancel</button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-soft">Your Guardians ({guardians.length})</h3>
          <div className="space-y-3">
            {guardians.map((g) => (
              <Card key={g.id} className="group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={g.name} size={48} />
                  <div>
                    <div className="font-bold text-ink">{g.name}</div>
                    <div className="text-xs text-ink-soft">{g.relation} · {g.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={g.status === "active" ? "active" : "pending"}>{g.status}</Badge>
                  <button
                    onClick={() => remove(g.id)}
                    disabled={busy === g.id}
                    title="Remove guardian"
                    className="grid h-8 w-8 place-items-center rounded-xl text-ink-soft opacity-0 transition hover:bg-red-50 hover:text-danger group-hover:opacity-100"
                  >
                    {busy === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Card className="bg-gradient-to-br from-primary-50 to-white">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-soft">
                <ShieldCheck className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <div className="font-bold text-ink">Recovery Threshold</div>
                <div className="text-sm text-ink-soft">{recovery.threshold}-of-{active.length} guardians required</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-ink"><KeyRound className="h-4 w-4 text-primary-500" /> Recovery</h3>
              <button onClick={reset} disabled={busy === "reset"} className="btn-soft text-xs">
                {busy === "reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset
              </button>
            </div>
            <p className="mb-4 text-xs text-ink-soft">Each active guardian approves the recovery. Access is restored when the threshold is met.</p>
            <div className="space-y-2">
              {active.map((g) => {
                const approved = recovery.approvals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => approve(g.id)}
                    disabled={busy === g.id}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                      approved ? "bg-primary-50 text-primary-700" : "bg-bg-secondary text-ink-soft hover:bg-sage"
                    }`}
                  >
                    <span className="font-semibold">{g.name}</span>
                    <span className="flex items-center gap-1.5">
                      {busy === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : approved ? <><Check className="h-4 w-4" /> Approved</> : "Tap to approve"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl bg-bg-secondary p-4 text-center">
              <div className="text-sm font-semibold text-ink">{approvedCount} / {recovery.threshold} approvals</div>
              {recovered ? (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="h-4 w-4" /> Access Restored
                </div>
              ) : (
                <div className="mt-2 text-xs text-ink-soft">Need {Math.max(0, recovery.threshold - approvedCount)} more approval(s)</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
