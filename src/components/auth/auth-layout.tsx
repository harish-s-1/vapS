import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck, Brain, HeartPulse } from "lucide-react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 to-emerald p-12 text-white lg:flex">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link href="/" className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">patS</div>
              <div className="text-[10px] uppercase tracking-wide text-white/80">Patient-Sovereign Network</div>
            </div>
          </div>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">Your health data. Your rules.</h2>
          <p className="mt-3 text-white/85">
            The patient-sovereign network for verified prescriptions, AI clinical safety, and instant emergency access.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: ShieldCheck, t: "Patient-controlled records", d: "You decide who sees what, and for how long." },
              { icon: Brain, t: "AI clinical safety", d: "Real-time drug interaction & allergy checks." },
              { icon: HeartPulse, t: "Emergency access", d: "Critical info available when seconds matter." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">{f.t}</div>
                  <div className="text-sm text-white/80">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/70">© 2026 patS Health. HIPAA-aligned • End-to-end encrypted.</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
