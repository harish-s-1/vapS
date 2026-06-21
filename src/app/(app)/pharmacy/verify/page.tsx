"use client";

import { useEffect, useState } from "react";
import { QrCode, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { prescriptionsApi } from "@/lib/api";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sample, setSample] = useState<string>("");
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    prescriptionsApi.list().then((r) => setSample(r[0]?.code ?? "")).catch(() => {});
  }, []);

  const check = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await prescriptionsApi.verify(code);
      setResult(
        res.verified && res.prescription
          ? { ok: true, msg: `Valid — issued by ${res.prescription.doctor} for ${res.prescription.patient}.` }
          : { ok: false, msg: res.reason ?? "No matching prescription found in the network." }
      );
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : "Network error." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Manual Verification" subtitle="Enter a prescription ID to verify signature and authenticity." />
      <Card className="mx-auto max-w-xl p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600"><QrCode className="h-6 w-6" /></div>
          <div>
            <div className="font-bold text-ink">Prescription Lookup</div>
            <div className="text-xs text-ink-soft">Cross-checks doctor, prescription record & digital signature.</div>
          </div>
        </div>
        <label className="label">Prescription ID</label>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} placeholder="VTX-RX-XXXXXXXX" className="input font-mono" />
          <button onClick={check} disabled={!code || busy} className="btn-primary shrink-0">{busy ? "Verifying…" : "Verify"}</button>
        </div>
        {sample && <div className="mt-2 text-xs text-ink-soft">Sample: {sample}</div>}

        {result && (
          <div className={`mt-6 flex items-center gap-3 rounded-2xl p-4 ${result.ok ? "bg-primary-50 text-primary-700" : "bg-red-50 text-danger"}`}>
            {result.ok ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            <div>
              <div className="font-bold">{result.ok ? "VERIFIED" : "REJECTED"}</div>
              <div className="text-sm opacity-90">{result.msg}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
