"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shell/app-shell";
import { Card, Badge, Avatar } from "@/components/ui/primitives";

const users = [
  { id: "u1", name: "Ananya Sharma", email: "ananya@pats.health", role: "patient", status: "active", joined: "2024-06-12" },
  { id: "u2", name: "Dr. Meera Singh", email: "meera@pats.health", role: "doctor", status: "active", joined: "2024-03-04" },
  { id: "u3", name: "Apollo Pharmacy", email: "apollo@pats.health", role: "pharmacy", status: "active", joined: "2024-08-21" },
  { id: "u4", name: "Dr. Rahul Verma", email: "rahul@pats.health", role: "doctor", status: "active", joined: "2025-01-15" },
  { id: "u5", name: "Karan Malhotra", email: "karan@pats.health", role: "patient", status: "suspended", joined: "2024-11-30" },
  { id: "u6", name: "City Diagnostics", email: "city@pats.health", role: "pharmacy", status: "pending", joined: "2025-05-01" },
];

const roleTone: Record<string, "active" | "approved" | "pending"> = { patient: "active", doctor: "approved", pharmacy: "pending" };

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const rows = users.filter((u) => (role === "all" || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage patients, doctors, pharmacies and access." action={<button className="btn-primary"><UserPlus className="h-4 w-4" /> Add User</button>} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="input pl-11" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input sm:w-44">
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="pharmacy">Pharmacies</option>
        </select>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.05] bg-bg-secondary/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-6 py-3 font-semibold">User</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((u) => (
              <tr key={u.id} className="transition hover:bg-bg-secondary/40">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size={38} />
                    <div><div className="font-semibold text-ink">{u.name}</div><div className="text-xs text-ink-soft">{u.email}</div></div>
                  </div>
                </td>
                <td className="px-6 py-3"><Badge tone={roleTone[u.role]}>{u.role}</Badge></td>
                <td className="px-6 py-3 text-ink-soft">{u.joined}</td>
                <td className="px-6 py-3"><Badge tone={u.status === "active" ? "active" : u.status === "suspended" ? "rejected" : "pending"}>{u.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
