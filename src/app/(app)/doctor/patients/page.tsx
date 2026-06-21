"use client";

import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { doctorPatients } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function DoctorPatients() {
  const [q, setQ] = useState("");
  const list = doctorPatients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.condition.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="My Patients" subtitle="Patients who have granted you access to their records." />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients…" className="input pl-11" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id} className="cursor-pointer">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} size={52} />
              <div className="flex-1">
                <div className="font-bold text-ink">{p.name}</div>
                <div className="text-xs text-ink-soft">{p.age} years · {p.condition}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-soft" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-bg-secondary px-4 py-2.5 text-xs">
              <span className="text-ink-soft">Last visit: {formatDate(p.lastVisit)}</span>
              <Badge tone={p.risk === "high" ? "high" : p.risk === "moderate" ? "moderate" : "low"}>{p.risk} risk</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
