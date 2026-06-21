"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Stethoscope, Store, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleSignIn } from "@/components/auth/google-signin";
import { useAuth } from "@/lib/store";
import { navByRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles: { id: Role; label: string; icon: typeof User }[] = [
  { id: "patient", label: "Patient", icon: User },
  { id: "doctor", label: "Doctor", icon: Stethoscope },
  { id: "pharmacy", label: "Pharmacy", icon: Store },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

export default function LoginPage() {
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role, undefined, email || undefined);
    router.push(navByRole[role][0].href);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your patS health network.">
      <div className="mb-5">
        <GoogleSignIn />
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-black/[0.07]" />
          <span className="text-xs font-medium text-ink-soft">or sign in with email</span>
          <span className="h-px flex-1 bg-black/[0.07]" />
        </div>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Sign in as</label>
          <div className="grid grid-cols-4 gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border border-black/[0.05] bg-white px-2 py-3 text-xs font-semibold text-ink-soft transition-all",
                  role === r.id ? "border-primary-300 bg-primary-50 text-primary-700 shadow-glow" : "hover:bg-bg-secondary"
                )}
              >
                <r.icon className="h-5 w-5" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-11"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input px-11"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3.5">
          Sign in to patS
        </button>

        <p className="rounded-2xl bg-bg-secondary px-4 py-3 text-center text-xs text-ink-soft">
          Demo mode — pick a role and click sign in. No password needed.
        </p>

        <p className="text-center text-sm text-ink-soft">
          New to patS?{" "}
          <Link href="/register" className="font-semibold text-primary-600 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
