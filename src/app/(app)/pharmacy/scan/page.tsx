"use client";

import { useEffect, useState } from "react";
import { ScanLine, CheckCircle2, XCircle, ShieldCheck, Stethoscope, User, Loader2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { prescriptionsApi } from "@/lib/api";
import type { Prescription } from "@/lib/types";

type Result = { ok: true; rx: Prescription } | { ok: false; reason: string } | null;

export default function ScanPage() {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [samples, setSamples] = useState<Prescription[]>([]);

  useEffect(() => {
    prescriptionsApi.list().then((rows) => setSamples(rows.slice(0, 4))).catch(() => {});
  }, []);

  const verify = async (input: string) => {
    if (!input.trim()) return;
    setScanning(true);
    setResult(null);
    try {
      // brief delay so the scan animation reads as a real verification
      await new Promise((r) => setTimeout(r, 700));
      const res = await prescriptionsApi.verify(input);
      if (res.verified && res.prescription) setResult({ ok: true, rx: res.prescription });
      else setResult({ ok: false, reason: res.reason ?? "Verification failed." });
    } catch (e) {
      setResult({ ok: false, reason: e instanceof Error ? e.message : "Network error during verification." });
    } finally {
      setScanning(false);
    }
  };

  const reset = () => { setResult(null); setCode(""); };

  return (
    <div>
      <PageHeader title="Prescription Verification" subtitle="Scan the QR or enter the prescription ID to verify authenticity." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <Card className="p-7">
          <div className="relative mx-auto grid h-56 w-56 place-items-center overflow-hidden rounded-3xl bg-bg-secondary">
            <ScanLine className="h-20 w-20 text-primary-300" />
            <div className="absolute inset-x-6 top-6 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-primary-500/70 shadow-[0_0_12px_2px_rgba(76,175,80,0.5)]" />
            <div className="absolute left-4 top-4 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-primary-500" />
            <div className="absolute right-4 top-4 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-primary-500" />
            <div className="absolute bottom-4 left-4 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-primary-500" />
            <div className="absolute bottom-4 right-4 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-primary-500" />
          </div>
          <div className="mt-6">
            <label className="label">Or enter Prescription ID</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify(code)}
                placeholder="VTX-RX-XXXXXXXX"
                className="input font-mono"
              />
              <button onClick={() => verify(code)} disabled={!code || scanning} className="btn-primary shrink-0">Verify</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {samples.map((p) => (
                <button key={p.id} onClick={() => { setCode(p.code); verify(p.code); }} className="chip bg-primary-50 text-primary-700">{p.code}</button>
              ))}
              <button onClick={() => { setCode("VTX-RX-FAKE0000"); verify("VTX-RX-FAKE0000"); }} className="chip bg-red-50 text-danger">Try invalid</button>
            </div>
          </div>
        </Card>

        {/* Result */}
        <Card className="flex flex-col p-7">
          {scanning ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
              <p className="mt-4 font-semibold text-ink">Verifying with patS network…</p>
              <p className="text-xs text-ink-soft">Checking doctor, prescription & signature</p>
            </div>
          ) : result === null ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-ink-soft">
              <ShieldCheck className="h-12 w-12 text-primary-200" />
              <p className="mt-3 font-semibold">Verification result will appear here</p>
            </div>
          ) : result.ok ? (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-50 text-primary-600">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h3 className="mt-3 text-2xl font-extrabold text-primary-600">VERIFIED</h3>
                <p className="text-sm text-ink-soft">Authentic & safe to dispense</p>
              </div>
              <div className="mt-5 space-y-2 rounded-2xl bg-bg-secondary p-4 text-sm">
                <Line icon={<User className="h-4 w-4" />} label="Patient" value={result.rx.patient} />
                <Line icon={<Stethoscope className="h-4 w-4" />} label="Doctor" value={result.rx.doctor} />
                <Line icon={<ShieldCheck className="h-4 w-4" />} label="Signature" value="Valid" />
              </div>
              <div className="mt-4 space-y-1.5">
                {result.rx.medicines.map((m, i) => (
                  <div key={i} className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-card">
                    <span className="font-semibold text-ink">{m.name} {m.dosage}</span>
                    <span className="text-ink-soft">{m.frequency}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button className="btn-primary flex-1">Mark Dispensed</button>
                <button onClick={reset} className="btn-soft"><RotateCcw className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50 text-danger">
                <XCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-3 text-2xl font-extrabold text-danger">REJECTED</h3>
              <p className="mt-1 max-w-xs text-sm text-ink-soft">{result.reason}</p>
              <button onClick={reset} className="btn-soft mt-5"><RotateCcw className="h-4 w-4" /> Scan again</button>
            </div>
          )}
        </Card>
      </div>

      <style jsx global>{`
        @keyframes scan { 0%, 100% { top: 1.5rem } 50% { top: calc(100% - 1.5rem) } }
      `}</style>
    </div>
  );
}

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink-soft">{icon} {label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
