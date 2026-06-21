"use client";

import Link from "next/link";
import { ScanLine, CheckCircle2, XCircle, FileText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, StatIcon } from "@/components/ui/primitives";
import { dispensingHistory } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function PharmacyDashboard() {
  const verified = dispensingHistory.filter((d) => d.status === "Verified").length;
  const rejected = dispensingHistory.filter((d) => d.status === "Rejected").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Pharmacy Portal" subtitle="Verify and dispense doctor-signed prescriptions with confidence." />

      <div className="grid gap-5 sm:grid-cols-3">
        <Card><div className="mb-2"><StatIcon tone="primary"><CheckCircle2 className="h-5 w-5" /></StatIcon></div><div className="text-3xl font-extrabold text-ink">{verified}</div><div className="text-xs text-ink-soft">Verified Today</div></Card>
        <Card><div className="mb-2"><StatIcon tone="amber"><XCircle className="h-5 w-5" /></StatIcon></div><div className="text-3xl font-extrabold text-ink">{rejected}</div><div className="text-xs text-ink-soft">Rejected</div></Card>
        <Card><div className="mb-2"><StatIcon tone="blue"><FileText className="h-5 w-5" /></StatIcon></div><div className="text-3xl font-extrabold text-ink">{dispensingHistory.length}</div><div className="text-xs text-ink-soft">Total Dispensed</div></Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white shadow-soft"><ScanLine className="h-7 w-7 text-primary-500" /></div>
          <div>
            <h3 className="text-lg font-bold text-ink">Ready to verify a prescription?</h3>
            <p className="text-sm text-ink-soft">Scan a QR code or enter the prescription ID to verify instantly.</p>
          </div>
        </div>
        <Link href="/pharmacy/scan" className="btn-primary">Open Scanner <ArrowRight className="h-4 w-4" /></Link>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-soft">Recent Dispensing</h3>
          <Link href="/pharmacy/history" className="text-xs font-semibold text-primary-600 hover:underline">View All</Link>
        </div>
        <Card className="divide-y divide-black/[0.05] p-0">
          {dispensingHistory.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="font-mono text-sm font-semibold text-ink">{d.code}</div>
                <div className="text-xs text-ink-soft">{d.patient} · {d.doctor} · {formatDate(d.date)}</div>
              </div>
              <Badge tone={d.status === "Verified" ? "approved" : "rejected"}>{d.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
