"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { dispensingHistory } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [q, setQ] = useState("");
  const rows = dispensingHistory.filter((d) => `${d.code} ${d.patient} ${d.doctor}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Dispensing History" subtitle="A complete audit trail of every verified and rejected prescription." />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, patient, doctor…" className="input pl-11" />
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.05] bg-bg-secondary/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-6 py-3 font-semibold">Prescription ID</th>
              <th className="px-6 py-3 font-semibold">Patient</th>
              <th className="px-6 py-3 font-semibold">Doctor</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((d) => (
              <tr key={d.id} className="transition hover:bg-bg-secondary/40">
                <td className="px-6 py-4 font-mono font-semibold text-ink">{d.code}</td>
                <td className="px-6 py-4 text-ink">{d.patient}</td>
                <td className="px-6 py-4 text-ink-soft">{d.doctor}</td>
                <td className="px-6 py-4 text-ink-soft">{formatDate(d.date)}</td>
                <td className="px-6 py-4"><Badge tone={d.status === "Verified" ? "approved" : "rejected"}>{d.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
