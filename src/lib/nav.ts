import {
  LayoutDashboard,
  FolderHeart,
  FileText,
  CalendarDays,
  Pill,
  HeartPulse,
  Activity,
  ShieldPlus,
  Lock,
  Users,
  PhoneCall,
  QrCode,
  ScanLine,
  ShieldAlert,
  BarChart3,
  Stethoscope,
  Brain,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional grouping header shown above this item in the sidebar. */
  section?: string;
}

export const navByRole: Record<Role, NavLink[]> = {
  patient: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Prescriptions", href: "/prescriptions", icon: FileText, section: "Health" },
    { label: "Medications", href: "/medications", icon: Pill, section: "Health" },
    { label: "Health Vault", href: "/vault", icon: FolderHeart, section: "Health" },
    { label: "Emergency Card", href: "/emergency", icon: ShieldPlus, section: "Health" },
    { label: "Access Requests", href: "/consent", icon: Lock, section: "Security" },
    { label: "Guardian Access", href: "/guardians", icon: Users, section: "Security" },
    { label: "Voice Assistant", href: "/voice", icon: PhoneCall, section: "Support" },
  ],
  doctor: [
    { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
    { label: "My Patients", href: "/doctor/patients", icon: Users },
    { label: "Prescriptions", href: "/doctor/prescribe", icon: FileText },
    { label: "Clinical Safety", href: "/doctor/safety", icon: Brain },
    { label: "Risk Alerts", href: "/doctor/alerts", icon: ShieldAlert },
    { label: "Access Requests", href: "/doctor/access", icon: Lock },
  ],
  pharmacy: [
    { label: "Dashboard", href: "/pharmacy", icon: LayoutDashboard },
    { label: "QR Scanner", href: "/pharmacy/scan", icon: ScanLine },
    { label: "Verification", href: "/pharmacy/verify", icon: QrCode },
    { label: "Dispensing History", href: "/pharmacy/history", icon: FileText },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Security Events", href: "/admin/security", icon: ShieldAlert },
    { label: "System Health", href: "/admin/system", icon: Stethoscope },
  ],
};
