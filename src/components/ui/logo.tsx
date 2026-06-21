import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-neu-out">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M12 21s-7-4.35-9.5-9.04C1 8.5 2.8 5 6.2 5c2 0 3.2 1.2 3.8 2.2.6-1 1.8-2.2 3.8-2.2 1.6 0 2.9.8 3.7 2"
            stroke="#4CAF50"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13 11h2.5l1.5 3 2-6 1.2 3H23" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-xl font-extrabold tracking-tight text-primary-700">patS</div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-ink-soft">Patient-Sovereign Network</div>
        </div>
      )}
    </div>
  );
}
