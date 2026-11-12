import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wrench, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useTheme } from "@/hooks/theme";
import { api, ApiError, tokenStore } from "@/lib/api";
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

export default function Login() {
  const { signIn } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
            setErr(null);
            const data = await api<{
              access_token: string;
              user: { user_id: number; email: string; role: Role };
            }>("/auth/google", {
              method: "POST",
              json: { credential: resp.credential, role: "worker" },
              auth: false,
            });
            tokenStore.set(data.access_token);
            localStorage.setItem("worksite.user", JSON.stringify(data.user));
            window.location.href = "/jobs";
          } catch (e) {
            const msg = e instanceof ApiError ? e.message : "Google sign-in failed";
            setErr(msg);
            toast.error(msg);
          } finally {
            setBusy(false);
          }
        },
      });
      const el = document.getElementById("google-btn-login");
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "signin_with",
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, theme]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate("/jobs");
    } catch (x) {
      const msg = x instanceof ApiError ? x.message : "Sign in failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-[#09090B]">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
              <Wrench className="size-3.5" />
            </div>
            Worksite
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sign in to Worksite
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Jobs, crews and payments in one place.
            </p>

            {err && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {err}
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {clientId && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  <span className="text-xs text-zinc-400">or</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="flex justify-center">
                  <div id="google-btn-login" />
                </div>
              </>
            )}

            {!clientId && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Google Sign-In is not configured. Set{" "}
                <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and backend{" "}
                <code className="font-mono">GOOGLE_CLIENT_ID</code>.
              </p>
            )}

            <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              New here?{" "}
              <Link to="/register" className="font-medium text-accent hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
