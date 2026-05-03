import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

export type UserRole   = "admin" | "corretor" | "usuario";
export type UserStatus = "pending" | "active" | "revoked";

export interface Profile {
  id:         string;
  full_name:  string | null;
  role:       UserRole;
  status:     UserStatus;
  avatar_url: string | null;
}

interface AuthContextValue {
  user:    User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp:  (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  signIn:  (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveProfile(user: User): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, avatar_url")
    .eq("id", user.id)
    .single();

  if (data) return { ...data, status: (data.status ?? "active") } as Profile;

  // Fallback enquanto a tabela não existe: usa user_metadata do cadastro
  const meta = user.user_metadata ?? {};
  const role = (["admin", "corretor", "usuario"].includes(meta.role)
    ? meta.role : "usuario") as UserRole;

  return {
    id:         user.id,
    full_name:  (meta.full_name as string) ?? user.email ?? null,
    role,
    status:     "active",   // sem tabela = sem controle; fallback ativo
    avatar_url: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronous: sets user/session immediately; profile loads in background
  const applySession = (sess: Session | null) => {
    setSession(sess);
    const u = sess?.user ?? null;
    setUser(u);
    if (u) {
      resolveProfile(u).then(setProfile).catch(() => setProfile(null));
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Safety timeout — unblocks navbar if Supabase is slow/unreachable
    const safetyTimeout = setTimeout(() => setLoading(false), 2500);

    supabase.auth.getSession()
      .then(({ data: { session } }) => { applySession(session); })
      .catch(() => {})
      .finally(() => {
        clearTimeout(safetyTimeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { applySession(session); }
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
