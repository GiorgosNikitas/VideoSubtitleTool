import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type AccountProfile = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
};

type AuthResult = {
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  accessToken: string | null;
  configured: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  profile: AccountProfile | null;
  session: Session | null;
  user: User | null;
  refreshProfile: () => Promise<AccountProfile | null>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (redirectTo: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, profile: { firstName: string; lastName: string }) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiMessage(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    return typeof parsed.message === "string" ? parsed.message : typeof parsed.error === "string" ? parsed.error : fallback;
  } catch {
    return text.slice(0, 500) || fallback;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setProfile(null);
      return null;
    }

    const response = await fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await apiMessage(response, `Account request failed with ${response.status}.`));
    }

    const payload = (await response.json()) as { profile: AccountProfile };
    setProfile(payload.profile);
    return payload.profile;
  }, [session?.access_token]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession) setProfile(null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    void refreshProfile().catch(() => {
      setProfile(null);
    });
  }, [refreshProfile, session]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user ?? data.session?.user ?? null);
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, profile: { firstName: string; lastName: string }) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    if (error) throw error;
    if (!data.session) return { needsEmailConfirmation: true };

    setSession(data.session);
    setUser(data.user ?? data.session?.user ?? null);
    return {};
  }, []);

  const signInWithGoogle = useCallback(async (redirectTo: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: session?.access_token ?? null,
      configured: isSupabaseConfigured,
      isAuthenticated: Boolean(session?.access_token),
      loading,
      profile,
      session,
      user,
      refreshProfile,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
    }),
    [loading, profile, refreshProfile, session, signIn, signInWithGoogle, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
