import { cn, initials } from "@/lib/utils";
import type { Severity } from "@/lib/types";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card card-hover p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {action}
    </div>
  );
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className="grid place-items-center rounded-full bg-primary-100 font-bold text-primary-700"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

const sevStyles: Record<Severity | "active" | "approved" | "pending" | "rejected" | "expired", string> = {
  low: "bg-primary-50 text-primary-700",
  moderate: "bg-amber-50 text-amber-600",
  high: "bg-orange-50 text-orange-600",
  critical: "bg-red-50 text-danger",
  active: "bg-primary-50 text-primary-700",
  approved: "bg-primary-50 text-primary-700",
  pending: "bg-amber-50 text-amber-600",
  rejected: "bg-red-50 text-danger",
  expired: "bg-slate-100 text-ink-soft",
};

export function Badge({ tone = "low", children }: { tone?: keyof typeof sevStyles; children: React.ReactNode }) {
  return <span className={cn("chip capitalize", sevStyles[tone] ?? sevStyles.low)}>{children}</span>;
}

export function StatIcon({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "blue" | "amber" | "emerald" }) {
  const map = {
    primary: "bg-primary-50 text-primary-600",
    blue: "bg-blue-50 text-info",
    amber: "bg-amber-50 text-warning",
    emerald: "bg-emerald-50 text-emerald",
  };
  return <div className={cn("stat-icon", map[tone])}>{children}</div>;
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "amber" | "danger" }) {
  const colors = { primary: "bg-primary-500", amber: "bg-warning", danger: "bg-danger" };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-bg-secondary/50 py-16 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary-500 shadow-soft">{icon}</div>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
