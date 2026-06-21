"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/store";
import { navByRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles: { id: Role; label: string }[] = [
  { id: "patient", label: "Patient" },
  { id: "doctor", label: "Doctor" },
  { id: "pharmacy", label: "Pharmacy" },
];

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role, name || undefined, email || undefined);
    router.push(navByRole[role][0].href);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join the patient-sovereign health network.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={cn(
                  "rounded-2xl border border-black/[0.05] bg-white px-3 py-2.5 text-sm font-semibold text-ink-soft transition-all",
                  role === r.id ? "border-primary-300 bg-primary-50 text-primary-700 shadow-glow" : "hover:bg-bg-secondary"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Sharma" className="input pl-11" required />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input pl-11" required />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input type="password" placeholder="Create a strong password" className="input pl-11" required />
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-ink-soft">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-black/10 accent-primary-500" />
          I agree to patS's Terms of Service and HIPAA-aligned Privacy Policy.
        </label>

        <button type="submit" className="btn-primary w-full py-3.5">
          Create account
        </button>

        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
