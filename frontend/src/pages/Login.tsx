import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth";
import { ApiError, register } from "@/lib/api";
import { Button, Field, Input, Select } from "@/components/ui";

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [role, setRole] = useState<"worker" | "contractor">("worker");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (mode === "up") { await register(email, password, role); toast.success("Account created"); }
      await signIn(email, password);
    } catch (x) { setErr(x as ApiError); } finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div><h1 className="text-xl font-semibold tracking-tight">{mode === "in" ? "Sign in to Worksite" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-zinc-500">Jobs, crews and payments in one place.</p></div>
        {err && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{err.message}</p>}
        <Field label="Email" error={err?.fields.email}><Input type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password" error={err?.fields.password} hint={mode === "up" ? "At least 8 characters" : undefined}>
          <Input type="password" required minLength={mode === "up" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {mode === "up" && <Field label="I am a"><Select value={role} onChange={(e) => setRole(e.target.value as "worker" | "contractor")}><option value="worker">Worker looking for jobs</option><option value="contractor">Contractor hiring crews</option></Select></Field>}
        <Button type="submit" variant="primary" loading={busy} className="w-full">{mode === "in" ? "Sign in" : "Create account"}</Button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }} className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</button>
      </form>
    </div>
  );
}
