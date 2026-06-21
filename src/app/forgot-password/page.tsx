"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState<"email" | "guardian">("email");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="Recovery instructions are on the way.">
        <div className="space-y-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary-50 text-primary-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-ink-soft">
            {mode === "email"
              ? "We've sent a password reset link to your email. It expires in 30 minutes."
              : "Your guardians have been notified. Recovery completes once the approval threshold is met."}
          </p>
          <Link href="/login" className="btn-ghost mx-auto w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Recover access via email or your trusted guardians.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-bg-secondary p-1.5">
          {[
            { id: "email" as const, label: "Email reset", icon: Mail },
            { id: "guardian" as const, label: "Guardian recovery", icon: Users },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                mode === t.id ? "bg-white text-primary-700 shadow-card" : "text-ink-soft"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-5"
        >
          {mode === "email" ? (
            <div>
              <label className="label">Account email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input type="email" placeholder="you@example.com" className="input pl-11" required />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary-50 p-4 text-sm text-primary-700">
                Guardian recovery sends an approval request to your trusted guardians. Recovery requires a
                <span className="font-bold"> 2-of-3</span> threshold approval.
              </div>
              <div>
                <label className="label">Your account email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <input type="email" placeholder="you@example.com" className="input pl-11" required />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3.5">
            {mode === "email" ? "Send reset link" : "Notify guardians"}
          </button>
        </form>

        <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-soft hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
