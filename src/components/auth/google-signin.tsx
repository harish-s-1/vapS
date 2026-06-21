"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GooglePayload {
  name?: string;
  email?: string;
  picture?: string;
}

// Decode the payload of a Google ID-token (JWT) without verifying the signature
// (verification happens server-side in production).
function decodeJwt(token: string): GooglePayload | null {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function GoogleSignIn() {
  const router = useRouter();
  const socialLogin = useAuth((s) => s.socialLogin);
  const btnRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const finish = (name: string, email: string, avatar?: string) => {
    socialLogin({ name, email, avatar });
    router.push("/dashboard");
  };

  useEffect(() => {
    if (!CLIENT_ID || typeof window === "undefined") return;
    const SCRIPT_ID = "google-gsi";

    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !btnRef.current) return;
      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp: { credential: string }) => {
          const p = decodeJwt(resp.credential);
          if (p?.email) finish(p.name || p.email.split("@")[0], p.email, p.picture);
          else setErr("Could not read your Google profile.");
        },
      });
      g.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 360,
        logo_alignment: "center",
      });
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = init;
    s.onerror = () => setErr("Failed to load Google sign-in.");
    document.body.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real Google button (rendered by Google Identity Services)
  if (CLIENT_ID) {
    return (
      <div className="space-y-2">
        <div ref={btnRef} className="flex justify-center" />
        {err && <p className="text-center text-xs text-danger">{err}</p>}
      </div>
    );
  }

  // Demo fallback — no Google client ID configured yet. Looks and behaves like the
  // real flow so it's usable immediately; set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable
  // genuine Google OAuth.
  return (
    <button
      type="button"
      onClick={() => finish("Google User", "googleuser@gmail.com")}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-ink shadow-card transition hover:bg-bg-secondary active:scale-[0.99]"
    >
      <GoogleIcon /> Continue with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C41.9 36.4 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
