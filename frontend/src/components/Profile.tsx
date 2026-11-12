import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/auth";
import { errMsg, useCreateContractor, useCreateWorker } from "@/hooks/queries";
import { ApiError } from "@/lib/api";
import { Button, Field, Input } from "@/components/ui";

/** Shown in place of a page when the logged-in worker/contractor has no profile row yet. */
export function ProfileSetup({ kind, onCreated }: { kind: "worker" | "contractor"; onCreated?: (workerId: number) => void }) {
  const { user } = useAuth();
  const cm = useCreateContractor(); const wm = useCreateWorker();
  const m = kind === "worker" ? wm : cm;
  const err = m.error instanceof ApiError ? m.error : null;
  const [f, setF] = useState({ name: "", contact: "", phone: "", city: "", years: "0", wage: "0" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (kind === "worker") wm.mutate({ full_name: f.name, phone: f.phone, city: f.city, experience_years: Number(f.years), expected_daily_wage: Number(f.wage), is_available: true }, { onSuccess: (w) => onCreated?.(w.worker_id) });
    else cm.mutate({ company_name: f.name, contact_person: f.contact, phone: f.phone, email: user!.email, city: f.city });
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 py-10">
      <div><h1 className="text-lg font-semibold tracking-tight">{kind === "worker" ? "Set up your worker profile" : "Set up your company"}</h1>
        <p className="mt-1 text-sm text-zinc-500">{kind === "worker" ? "Contractors see this when you apply." : "Needed before you can post jobs."}</p></div>
      {m.isError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{errMsg(m.error)}</p>}
      <Field label={kind === "worker" ? "Full name" : "Company name"} error={err?.fields.full_name ?? err?.fields.company_name}><Input required value={f.name} onChange={set("name")} /></Field>
      {kind === "contractor" && <Field label="Contact person" error={err?.fields.contact_person}><Input required value={f.contact} onChange={set("contact")} /></Field>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" error={err?.fields.phone}><Input required value={f.phone} onChange={set("phone")} inputMode="tel" /></Field>
        <Field label="City" error={err?.fields.city}><Input required value={f.city} onChange={set("city")} /></Field>
      </div>
      {kind === "worker" && <div className="grid grid-cols-2 gap-3">
        <Field label="Years of experience" error={err?.fields.experience_years}><Input type="number" min={0} value={f.years} onChange={set("years")} /></Field>
        <Field label="Expected daily wage (INR)" error={err?.fields.expected_daily_wage}><Input type="number" min={0} value={f.wage} onChange={set("wage")} /></Field>
      </div>}
      <Button type="submit" variant="primary" loading={m.isPending} className="w-full">Create profile</Button>
    </form>
  );
}
