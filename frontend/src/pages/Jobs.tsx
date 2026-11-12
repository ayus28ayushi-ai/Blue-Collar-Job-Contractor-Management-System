import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { errMsg, useJobs, useMyContractor, type JobFilters } from "@/hooks/queries";
import { useSearchHotkey } from "@/hooks/useSearchHotkey";
import { Button, EmptyState, ErrorBanner, Input, Mono, RowSkeletons, StatusBadge } from "@/components/ui";
import { JobFormSheet } from "@/components/JobForm";
import { JobSheet } from "@/components/JobSheet";
import { ProfileSetup } from "@/components/Profile";
import { cn, fmtDate, inr } from "@/lib/utils";

const PILLS = ["all", "open", "in_progress", "completed", "cancelled"] as const;

export default function Jobs() {
  const { user } = useAuth(); const isContractor = user?.role === "contractor";
  const [sp, setSp] = useSearchParams();
  const status = (PILLS as readonly string[]).includes(sp.get("status") ?? "") ? (sp.get("status") as JobFilters["status"]) : "open";
  const mine = isContractor && sp.get("scope") !== "all";
  const jobId = sp.get("job") ? Number(sp.get("job")) : null;
  const [q, setQ] = useState(sp.get("q") ?? ""); const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLInputElement>(null); useSearchHotkey(ref);

  const patch = (p: Record<string, string | null>) => setSp((cur) => { const n = new URLSearchParams(cur); for (const [k, v] of Object.entries(p)) v ? n.set(k, v) : n.delete(k); return n; }, { replace: true });
  useEffect(() => { const t = setTimeout(() => patch({ q: q || null }), 200); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const contractor = useMyContractor();
  const jobs = useJobs({ status, q, mine });
  if (isContractor && contractor.isSuccess && contractor.data === null) return <ProfileSetup kind="contractor" />;

  const needle = q.trim().toLowerCase();
  const rows = (jobs.data ?? []).filter((j) => !needle || [j.title, j.company, j.location, j.category, ...j.skills].some((s) => s?.toLowerCase().includes(needle)));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
        {isContractor && <Button variant="primary" onClick={() => setCreating(true)}><Plus className="size-4" />Post a job</Button>}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400" />
          <Input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && ref.current?.blur()} placeholder="Search title, place, skill" className="pl-8 pr-8" aria-label="Search jobs" />
          <kbd className="pointer-events-none absolute right-2 top-2.5 rounded border border-zinc-200 px-1 font-mono text-[10px] text-zinc-400 dark:border-zinc-700">/</kbd>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {PILLS.map((p) => (
            <button key={p} aria-pressed={status === p} onClick={() => patch({ status: p === "open" ? null : p })}
              className={cn("h-7 rounded-full border px-3 text-xs", status === p ? "border-accent bg-accent text-white" : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800")}>{p.replace("_", " ")}</button>))}
        </div>
        {isContractor && <button onClick={() => patch({ scope: mine ? "all" : null })} className="ml-auto text-xs text-zinc-500 underline-offset-2 hover:underline">{mine ? "Show all jobs" : "Show only mine"}</button>}
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
        {jobs.isLoading ? <RowSkeletons /> : jobs.isError ? <ErrorBanner message={errMsg(jobs.error)} onRetry={() => jobs.refetch()} /> :
          rows.length === 0 ? (
            <EmptyState title={needle ? "No jobs match your search" : "No jobs here yet"} body={needle ? "Try a different word or clear the filter." : isContractor && mine ? "Post your first job to start receiving applications." : "Nothing with this status right now."}
              action={needle ? <Button onClick={() => setQ("")}>Clear search</Button> : isContractor && mine ? <Button variant="primary" onClick={() => setCreating(true)}>Post a job</Button> : undefined} />
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((j) => (
                <li key={`${j.id}`}>
                  <button onClick={() => patch({ job: String(j.id) })} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-900">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{j.title}</p>
                      <p className="truncate text-xs text-zinc-500">{[j.company, j.location, j.category].filter(Boolean).join(", ")}</p>
                    </div>
                    <Mono className="hidden text-xs text-zinc-500 md:block">{fmtDate(j.startDate)}</Mono>
                    <Mono className="w-28 text-right text-sm">{inr(j.pay)}<span className="text-xs text-zinc-500">/{j.payType.slice(0, 1) === "f" ? "fixed" : j.payType === "daily" ? "day" : "hr"}</span></Mono>
                    <span className="hidden w-24 sm:block"><StatusBadge status={j.status} /></span>
                  </button>
                </li>))}
            </ul>)}
      </div>
      <JobSheet id={jobId} onClose={() => patch({ job: null })} />
      <JobFormSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
