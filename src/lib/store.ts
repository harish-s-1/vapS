"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "./types";

const demoUsers: Record<Role, User> = {
  patient: { id: "pt_001", name: "Ananya Sharma", email: "ananya@pats.health", role: "patient", bloodGroup: "O+" },
  doctor: { id: "dr_001", name: "Dr. Meera Singh", email: "meera@pats.health", role: "doctor" },
  pharmacy: { id: "ph_001", name: "Apollo Pharmacy", email: "apollo@pats.health", role: "pharmacy" },
  admin: { id: "ad_001", name: "System Admin", email: "admin@pats.health", role: "admin" },
};

export interface SocialProfile {
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (role: Role, name?: string, email?: string) => void;
  socialLogin: (profile: SocialProfile, provider?: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (role, name, email) => {
        const base = demoUsers[role];
        set({
          user: { ...base, name: name || base.name, email: email || base.email },
          token: `demo.${role}.${Math.random().toString(36).slice(2)}`,
        });
      },
      // Sign in via an external identity provider (e.g. Google). Always a patient.
      socialLogin: (profile, provider = "google") => {
        set({
          user: {
            id: demoUsers.patient.id,
            name: profile.name,
            email: profile.email,
            role: "patient",
            avatar: profile.avatar,
            bloodGroup: demoUsers.patient.bloodGroup,
          },
          token: `${provider}.${Math.random().toString(36).slice(2)}`,
        });
      },
      logout: () => set({ user: null, token: null }),
    }),
    { name: "pats-auth" }
  )
);
