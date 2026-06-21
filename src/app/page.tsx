import Link from "next/link";
import {
  ShieldCheck,
  Brain,
  HeartPulse,
  QrCode,
  FolderHeart,
  PhoneCall,
  ArrowRight,
  Lock,
  Activity,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const features = [
  { icon: FolderHeart, title: "Patient Health Vault", desc: "Prescriptions, labs, scans & conditions — searchable, categorized, yours." },
  { icon: Lock, title: "Digital Consent", desc: "Grant time-limited access. Approve, reject, and watch it expire automatically." },
  { icon: Brain, title: "AI Clinical Safety", desc: "Drug interaction, allergy & dosage checks with a clear risk score." },
  { icon: QrCode, title: "Verified Prescriptions", desc: "Doctor-signed, QR-verifiable scripts pharmacies can trust instantly." },
  { icon: Activity, title: "Health Timeline", desc: "An AI-generated journey of your diagnoses, treatments & progress." },
  { icon: PhoneCall, title: "Voice Care Assistant", desc: "Automated medication & appointment reminders that actually call." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-soft">Sign in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <span className="chip mx-auto bg-primary-50 text-primary-700">
          <HeartPulse className="h-3.5 w-3.5" /> Patient-Sovereign Prescription Intelligence
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          Your health data.
          <span className="bg-gradient-to-r from-primary-600 to-emerald bg-clip-text text-transparent"> Your control.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
          patS unifies fragmented health records into one secure network — with doctor-verified prescriptions, AI clinical
          safety, and emergency access when seconds matter.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-7 py-3.5 text-base">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-soft px-7 py-3.5 text-base">
            View demo dashboard
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary-500" /> HIPAA-aligned</span>
          <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary-500" /> End-to-end encrypted</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary-500" /> Guardian recovery</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hover p-7">
              <div className="stat-icon bg-primary-50 text-primary-600">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-emerald p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold">Built for hospitals. Owned by patients.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Role-based access for patients, doctors, pharmacies, and administrators — secured end to end.
          </p>
          <Link href="/register" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-semibold text-primary-700 transition hover:bg-white/90">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.04] py-8 text-center text-sm text-ink-soft">
        © 2026 patS Health · Patient-Sovereign Prescription Intelligence Network
      </footer>
    </div>
  );
}
