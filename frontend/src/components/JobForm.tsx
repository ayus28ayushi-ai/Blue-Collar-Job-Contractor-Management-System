import { useState, type FormEvent } from "react";
import { useCategories, useCreateJob, useMyContractor, useSkills } from "@/hooks/queries";
import { ApiError } from "@/lib/api";
import { Button, Field, Input, Select, Sheet, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PayType } from "@/types";

const blank = { title: "", description: "", category_id: "", location: "", pay_amount: "", pay_type: "daily" as PayType, workers_needed: "1", start_date: "", end_date: "" };

export function JobFormSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cats = useCategories(); const skills = useSkills(); const me = useMyContractor(); const create = useCreateJob();
  const [f, setF] = useState(blank); const [picked, setPicked] = useState<Record<number, number>>({});
  const err = create.error instanceof ApiError ? create.error : null;
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const dateErr = f.start_date && f.end_date && f.end_date < f.start_date ? "End date can't be before the start date" : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (dateErr || !me.data) return;
    create.mutate({
      contractor_id: me.data.contractor_id, category_id: Number(f.category_id), title: f.title, description: f.description || null, location: f.location,
      pay_amount: Number(f.pay_amount), pay_type: f.pay_type, workers_needed: Number(f.workers_needed), start_date: f.start_date, end_date: f.end_date,
      skills: Object.entries(picked).map(([id, y]) => ({ skill_id: Number(id), min_years_required: y })),
    }, { onSuccess: () => { setF(blank); setPicked({}); onClose(); } });
  }
  const toggle = (id: number) => setPicked((p) => { const n = { ...p }; if (id in n) delete n[id]; else n[id] = 0; return n; });
  return (
    <Sheet open={open} onClose={onClose} title="Post a job"
      footer={<div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" form="job-form" variant="primary" loading={create.isPending}>Post job</Button></div>}>
      <form id="job-form" onSubmit={submit} className="space-y-4">
        {err && !Object.keys(err.fields).some((k) => k !== "_") && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{err.message}</p>}
        <Field label="Title" error={err?.fields.title}><Input autoFocus required value={f.title} onChange={set("title")} placeholder="Site electrician, 5 days" /></Field>
        <Field label="Category" error={err?.fields.category_id}>
          <Select required value={f.category_id} onChange={set("category_id")}><option value="">Select…</option>{cats.data?.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</Select></Field>
        <Field label="Location" error={err?.fields.location}><Input required value={f.location} onChange={set("location")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pay (INR)" error={err?.fields.pay_amount}><Input required type="number" min={1} step="any" value={f.pay_amount} onChange={set("pay_amount")} /></Field>
          <Field label="Pay type"><Select value={f.pay_type} onChange={set("pay_type")}><option value="daily">Daily</option><option value="hourly">Hourly</option><option value="fixed">Fixed</option></Select></Field>
        </div>
        <Field label="Workers needed" error={err?.fields.workers_needed}><Input type="number" min={1} value={f.workers_needed} onChange={set("workers_needed")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" error={err?.fields.start_date}><Input required type="date" value={f.start_date} onChange={set("start_date")} /></Field>
          <Field label="End date" error={dateErr ?? err?.fields.end_date}><Input required type="date" min={f.start_date} value={f.end_date} onChange={set("end_date")} /></Field>
        </div>
        {err?.fields._ && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{err.fields._}</p>}
        <Field label="Description" error={err?.fields.description}><Textarea value={f.description} onChange={set("description")} /></Field>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Required skills</legend>
          <div className="flex flex-wrap gap-1.5">
            {skills.data?.map((s) => (
              <button type="button" key={s.skill_id} aria-pressed={s.skill_id in picked} onClick={() => toggle(s.skill_id)}
                className={cn("rounded-full border px-2.5 py-1 text-xs", s.skill_id in picked ? "border-accent bg-accent text-white" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800")}>{s.skill_name}</button>))}
          </div>
          {Object.keys(picked).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {Object.entries(picked).map(([id, years]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span>{skills.data?.find((s) => s.skill_id === Number(id))?.skill_name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">min years
                    <Input type="number" min={0} value={years} className="h-7 w-16 text-center font-mono" onChange={(e) => setPicked({ ...picked, [id]: Math.max(0, Number(e.target.value)) })} /></span>
                </div>))}
            </div>)}
        </fieldset>
      </form>
    </Sheet>
  );
}
