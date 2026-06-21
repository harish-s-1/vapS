"use client";

import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/primitives";
import { useAuth } from "@/lib/store";

const roleLabel: Record<string, string> = {
  patient: "Patient",
  doctor: "Doctor",
  pharmacy: "Pharmacy",
  admin: "Administrator",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-black/[0.04] bg-bg-primary/70 px-5 py-4 backdrop-blur-xl lg:px-8">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-2xl text-ink-soft hover:bg-surface lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input placeholder="Search anything…" className="input max-w-md pl-11" />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative grid h-11 w-11 place-items-center rounded-2xl bg-surface text-ink-soft shadow-card transition hover:text-primary-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-2xl bg-surface px-2.5 py-2 shadow-card transition hover:shadow-soft"
          >
            <Avatar name={user?.name ?? "User"} size={36} />
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-ink-soft">{roleLabel[user?.role ?? "patient"]}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-soft" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-black/[0.04] bg-surface p-2 shadow-soft">
              <div className="px-3 py-2 text-xs text-ink-soft">{user?.email}</div>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
