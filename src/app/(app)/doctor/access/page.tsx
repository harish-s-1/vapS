"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Send, Clock, CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { consentApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { doctorPatients } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { ConsentRequest } from "@/lib/types";

const SCOPES = ["Full medical history", "Active prescriptions", "Lab reports (last 6 months)", "Emergency card only"];

const statusIcon = {
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  revoked: <Ban className="h-3.5 w-3.5" />,
  expired: <Clock className="h-3.5 w-3.5" />,
};

export default function DoctorAccess() {
  const user = useAuth((s) => s.user);
  const requester = user?.name ?? "Dr. Meera Singh";
  const [patient, setPatient] = useState(doctorPatients[0].name);
  const [scope, setScope] = useState(SCOPES[0]);
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => consentApi.list({ requester }).then(setRequests), [requester]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const request = async () => {
    setSending(true);
    try {
      await consentApi.create({ patient, requester, requesterRole: "doctor", scope });
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Request Patient Access" subtitle="Patients approve every request — access expires automatically." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink"><Lock className="h-4 w-4 text-primary-500" /> New Access Request</h3>
          <label className="label">Patient</label>
          <select value={patient} onChange={(e) => setPatient(e.target.value)} className="input mb-4">
            {doctorPatients.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
          <label className="label">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="input mb-5">
            {SCOPES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={request} disabled={sending} className="btn-primary w-full">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send Request</>}
          </button>
          <p className="mt-3 text-xs text-ink-soft">The patient sees this instantly in their Consent Center and can approve or reject it.</p>
        </Card>

        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-soft">My Requests</h3>
          {loading ? (
            <Card className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></Card>
          ) : (
            <Card className="divide-y divide-black/[0.05] p-0">
              {requests.length === 0 && <div className="px-6 py-4 text-sm text-ink-soft">No requests yet. Send one to get started.</div>}
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.patient} size={42} />
                    <div>
                      <div className="text-sm font-semibold text-ink">{r.patient}</div>
                      <div className="text-xs text-ink-soft">
                        {r.scope} · {formatDate(r.requestedAt)}
                        {r.expiresAt && r.status === "approved" && ` · expires ${formatDate(r.expiresAt)}`}
                      </div>
                    </div>
                  </div>
                  <Badge tone={r.status === "approved" ? "approved" : r.status === "rejected" || r.status === "revoked" ? "rejected" : r.status === "expired" ? "expired" : "pending"}>
                    {statusIcon[r.status]} {r.status}
                  </Badge>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
