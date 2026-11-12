import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { login as loginReq, setUnauthorizedHandler, tokenStore } from "@/lib/api";
import type { AuthUser } from "@/types";

const USER_KEY = "worksite.user";
interface Ctx { user: AuthUser | null; signIn: (e: string, p: string) => Promise<void>; signOut: () => void }
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { const raw = localStorage.getItem(USER_KEY); return raw && tokenStore.get() ? (JSON.parse(raw) as AuthUser) : null; } catch { return null; }
  });
  const signOut = useCallback(() => { tokenStore.clear(); try { localStorage.removeItem(USER_KEY); } catch { /* */ } qc.clear(); setUser(null); }, [qc]);
  const signIn = useCallback(async (email: string, password: string) => {
    const res = await loginReq(email, password);
    tokenStore.set(res.access_token);
    try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch { /* */ }
    setUser(res.user);
  }, []);
  useEffect(() => setUnauthorizedHandler(() => { signOut(); toast.error("Session expired. Sign in again."); }), [signOut]);
  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error("AuthProvider missing"); return c; };
