"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { navByRole } from "@/lib/nav";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const role = user?.role ?? "patient";
  const links = navByRole[role];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col gap-6 border-r border-black/[0.04] bg-surface/80 p-5 backdrop-blur-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link href={navByRole[role][0].href} className="px-2 pt-1">
          <Logo />
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
          {links.map((link, i) => {
            const active = pathname === link.href || (link.href !== navByRole[role][0].href && pathname.startsWith(link.href));
            const Icon = link.icon;
            const showHeader = link.section && link.section !== links[i - 1]?.section;
            return (
              <div key={link.href}>
                {showHeader && (
                  <div className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">
                    {link.section}
                  </div>
                )}
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cn("nav-item", active && "nav-item-active")}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  {link.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
