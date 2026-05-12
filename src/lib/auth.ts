import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function currentUserIdSync(): string | null {
  // Best-effort sync read — components should prefer useAuth
  if (typeof window === "undefined") return null;
  try {
    const k = Object.keys(localStorage).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!k) return null;
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user?.id ?? parsed?.currentSession?.user?.id ?? null;
  } catch { return null; }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function sendSignupOtp(email: string, meta: { first_name: string; last_name: string; university: string; major: string }) {
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: meta },
  });
}

export async function sendLoginOtp(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
}

export async function verifySignupOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function verifyLoginOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function requestEmailChange(newEmail: string) {
  return supabase.auth.updateUser({ email: newEmail });
}

export async function verifyEmailChangeOtp(newEmail: string, token: string) {
  return supabase.auth.verifyOtp({ email: newEmail, token, type: "email_change" });
}

export async function signInWithGoogle() {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/onboarding` : undefined;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

export type { User, Session };
