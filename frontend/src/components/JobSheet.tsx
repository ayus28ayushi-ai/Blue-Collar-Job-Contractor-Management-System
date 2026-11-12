import { useState } from "react";
import { Check, X } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { errMsg, useApplicants, useApply, useJob, useJobStatus, useMyContractor, usePay, useSetApplicationStatus } from "@/hooks/queries";
import { Button, ErrorBanner, Select, Input, Sheet, Skeleton, StatusBadge, Mono, EmptyState } from "@/components/ui";
import { fmtDate, inr } from "@/lib/utils";
import type { JobApplicant } from "@/types";

function PayRow({ a, defaultAmount }: { a: JobApplicant; defaultAmount: number }) {
  const pay = usePay(); const [amount, setAmount] = useState(String(defaultAmount));
  const [method, setMethod] = useState<"cash" | "upi" | "bank_transfer">("upi"); const [done, setDone] = useState(false);
  if (done) return <span className="text-xs text-emerald-700 dark:text-emerald-400">Paid</span>;
  return (
    <form className="mt-2 flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); pay.mutate({ application_id: a.application_id, amount: Number(amount), method }, { onSuccess: () => setDone(true) }); }}>
      <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-7 w-24 font-mono text-xs" aria-label="Amount" />
      <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="h-7 w-auto text-xs" aria-label="Method"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank</option></Select>
      <Button size="sm" variant="primary" type="submit" loading={pay.isPending}>Pay</Button>
    </form>
  );
}

function Applicants({ jobId, pay }: { jobId: number; pay: number }) {
  const q = useApplicants(jobId, true); const set = useSetApplicationStatus(jobId);
  if (q.isLoading) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (q.isError) return <ErrorBanner message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState title="No applicants yet" body="Workers who apply will show up here for you to shortlist or accept." />;
  return (
    <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {q.data.map((a) => (
        <li key={a.application_id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{a.full_name}</p><p className="font-mono text-xs text-zinc-500">{a.phone} · {inr(a.expected_daily_wage)}/day</p></div>
            <StatusBadge status={a.status} />
          </div>
          <div className="mt-2 flex gap-1.5">
            {(a.status === "applied") && <Button size="sm" onClick={() => set.mutate({ id: a.application_id, status: "shortlisted" })}>Shortlist</Button>}
            {(a.status === "applied" || a.status === "shortlisted") && <>
              <Button size="sm" variant="primary" onClick={() => set.mutate({ id: a.application_id, status: "accepted" })}><Check className="size-3" />Accept</Button>
              <Button size="sm" variant="danger" onClick={() => set.mutate({ id: a.application_id, status: "rejected" })}><X className="size-3" />Reject</Button></>}
          </div>
          {a.status === "completed" && <PayRow a={a} defaultAmount={pay} />}
        </li>))}
    </ul>
  );
}

export function JobSheet({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { user } = useAuth(); const q = useJob(id); const me = useMyContractor(); const apply = useApply(); const status = useJobStatus();
  const j = q.data; const owns = !!j && user?.role === "contractor" && me.data?.contractor_id === j.contractorId;
  const canSeeApplicants = owns || user?.role === "admin";
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-zinc-500">{k}</dt><dd className="text-right">{v}</dd></div>;
  return (
    <Sheet open={id !== null} onClose={onClose} title={j?.title ?? "Job"}
      footer={j && user?.role === "worker" && j.status === "open" ? <Button variant="primary" className="w-full" loading={apply.isPending} onClick={() => apply.mutate(j.id)}>Apply for this job</Button> : undefined}>
      {q.isLoading && <div className="space-y-3"><Skeleton className="w-2/3" /><Skeleton className="h-24 w-full" /></div>}
      {q.isError && <ErrorBanner message={errMsg(q.error)} onRetry={() => q.refetch()} />}
      {j && (
        <div className="space-y-6">
          <dl className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {row("Status", <StatusBadge status={j.status} />)}
            {row("Company", j.company)}{row("Category", j.category)}{row("Location", j.location)}
            {row("Pay", <Mono>{inr(j.pay)} / {j.payType}</Mono>)}{row("Crew size", <Mono>{j.workersNeeded}</Mono>)}
            {row("Dates", <Mono>{fmtDate(j.startDate)} – {fmtDate(j.endDate)}</Mono>)}
          </dl>
          {j.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{j.skills.map((s) => <span key={s} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs dark:border-zinc-800">{s}</span>)}</div>}
          {owns && (
            <div className="flex flex-wrap gap-2">
              {j.status === "open" && <Button onClick={() => status.mutate({ id: j.id, status: "in_progress" })}>Start job</Button>}
              {j.status === "in_progress" && <Button variant="primary" onClick={() => status.mutate({ id: j.id, status: "completed" })}>Mark completed</Button>}
              {(j.status === "open" || j.status === "in_progress") && <Button variant="danger" onClick={() => status.mutate({ id: j.id, status: "cancelled" })}>Cancel job</Button>}
            </div>)}
          {canSeeApplicants && <section><h3 className="mb-2 text-sm font-semibold tracking-tight">Applicants</h3><Applicants jobId={j.id} pay={j.pay} /></section>}
        </div>)}
    </Sheet>
  );
}
