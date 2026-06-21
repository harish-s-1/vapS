"use client";

import { HeartPulse, Droplet, AlertTriangle, Pill, Activity, Phone, ShieldPlus, Share2 } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/primitives";
import { QR } from "@/components/ui/qr";
import { useAuth } from "@/lib/store";
import { patientProfile, medications } from "@/lib/mock-data";

export default function EmergencyPage() {
  const user = useAuth((s) => s.user);
  // Identity comes from the logged-in user; medical details fall back to the demo profile.
  const name = user?.name ?? patientProfile.name;
  const cardId = (user?.id ?? patientProfile.id).toUpperCase();
  const bloodGroup = user?.bloodGroup ?? patientProfile.bloodGroup;

  return (
    <div>
      <PageHeader
        title="Emergency Medical Card"
        subtitle="Critical health information, accessible instantly when seconds matter."
        action={<button className="btn-primary"><Share2 className="h-4 w-4" /> Share Card</button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* The card */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-danger to-red-500 p-7 text-white shadow-[0_20px_60px_rgba(239,68,68,0.25)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                <HeartPulse className="h-7 w-7" />
              </div>
              <div>
                <div className="text-lg font-extrabold">EMERGENCY CARD</div>
                <div className="text-xs text-white/80">patS Health Network</div>
              </div>
            </div>
            <ShieldPlus className="h-7 w-7 text-white/70" />
          </div>

          <div className="mt-6">
            <div className="text-2xl font-extrabold">{name}</div>
            <div className="text-sm text-white/80">Age {patientProfile.age} · ID {cardId}</div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field icon={<Droplet className="h-4 w-4" />} label="Blood Group" value={bloodGroup!} big />
            <Field icon={<AlertTriangle className="h-4 w-4" />} label="Allergies" value={patientProfile.allergies.join(", ")} />
            <Field icon={<Activity className="h-4 w-4" />} label="Chronic Conditions" value={patientProfile.chronicConditions.join(", ")} />
            <Field icon={<Pill className="h-4 w-4" />} label="Current Medications" value={medications.slice(0, 3).map((m) => m.name).join(", ")} />
          </div>

          <div className="mt-6 border-t border-white/20 pt-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-white/70">Emergency Contacts</div>
            {patientProfile.emergencyContacts.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-1">
                <span className="text-sm">{c.name} <span className="text-white/70">· {c.relation}</span></span>
                <span className="flex items-center gap-1.5 text-sm font-semibold"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR + access */}
        <div className="space-y-5">
          <Card className="flex flex-col items-center text-center">
            <h3 className="mb-3 font-bold text-ink">Instant Access QR</h3>
            <QR value={`https://pats.health/emergency/${user?.id ?? patientProfile.id}`} size={180} />
            <p className="mt-3 text-xs text-ink-soft">Emergency responders scan this to view your card instantly — no login required.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-ink">How it works</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2"><span className="text-primary-500">●</span> Only the emergency card is visible — full records stay private.</li>
              <li className="flex gap-2"><span className="text-primary-500">●</span> Every access is logged with time & location.</li>
              <li className="flex gap-2"><span className="text-primary-500">●</span> You're notified the moment your card is viewed.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, value, big }: { icon: React.ReactNode; label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-white/70">{icon} {label}</div>
      <div className={`mt-1 font-bold ${big ? "text-2xl" : "text-sm"}`}>{value}</div>
    </div>
  );
}
