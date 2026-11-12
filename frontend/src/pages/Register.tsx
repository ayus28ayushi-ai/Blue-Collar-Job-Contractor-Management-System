import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Wrench, Users, Building2 } from "lucide-react";
import { register as registerReq, api } from "@/lib/api";
import { useAuth } from "@/hooks/auth";
import { ApiError } from "@/lib/api";
import type { Role } from "@/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function Register() {
  const [params] = useSearchParams();
  const initialRole = (params.get("role") === "contractor" ? "contractor" : "worker") as "worker" | "contractor";
  const [role, setRole] = useState<"worker" | "contractor">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            setBusy(true);
            const data = await api<{
              access_token: string;
              user: { user_id: number; email: string; role: Role };
            }>("/auth/google", {
              method: "POST",
              json: { credential: resp.credential, role },
              auth: false,
            });
            // Use the same storage path as password login
            const { tokenStore } = await import("@/lib/api");
            tokenStore.set(data.access_token);
            localStorage.setItem("worksite.user", JSON.stringify(data.user));
            window.location.href = "/jobs";
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Google sign-in failed");
          } finally {
            setBusy(false);
          }
        },
      });
      const el = document.getElementById("google-btn-register");
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signup_with",
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await registerReq(email.trim().toLowerCase(), password, role);
      toast.success("Account created. Signing you in…");
      await signIn(email.trim().toLowerCase(), password);
      navigate("/profile");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
              <Wrench className="size-3.5" />
            </div>
            Worksite
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">Join as a worker or contractor</p>

            {/* Role selector */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                  role === "worker" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Users className="size-4" /> Worker
              </button>
              <button
                type="button"
                onClick={() => setRole("contractor")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                  role === "contractor" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Building2 className="size-4" /> Contractor
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>

            {clientId && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs text-zinc-400">or</span>
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>
                <div className="flex justify-center">
                  <div id="google-btn-register" />
                </div>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Google sign-up will create a {role} account
                </p>
              </>
            )}

            {!clientId && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Google Sign-In is not configured. Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and backend{" "}
                <code className="font-mono">GOOGLE_CLIENT_ID</code>.
              </p>
            )}

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
