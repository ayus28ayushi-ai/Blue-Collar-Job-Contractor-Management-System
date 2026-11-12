import type { ReactNode } from "react";
import { errMsg, useAnalytics } from "@/hooks/queries";
import { ErrorBanner, Mono, Skeleton, EmptyState } from "@/components/ui";
import { inr } from "@/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";

function Panel<D>({ title, q, children }: { title: string; q: UseQueryResult<D[]>; children: (d: D[]) => ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
      <h2 className="border-b border-zinc-200 px-4 py-2.5 text-sm font-semibold tracking-tight dark:border-zinc-800">{title}</h2>
      {q.isLoading ? <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="w-full" />)}</div> : q.isError ? <ErrorBanner message={errMsg(q.error)} onRetry={() => q.refetch()} /> :
        !q.data?.length ? <EmptyState title="No data yet" body="This fills in as jobs and applications are created." /> : <div className="p-4">{children(q.data)}</div>}
    </section>
  );
}
const Bar = ({ label, value, max, right }: { label: string; value: number; max: number; right?: string }) => (
  <div className="py-1.5"><div className="flex justify-between text-sm"><span className="truncate pr-3">{label}</span><Mono>{right ?? value}</Mono></div>
    <div className="mt-1 h-1 rounded bg-zinc-100 dark:bg-zinc-800"><div className="h-1 rounded bg-accent" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div></div>
);

export default function Insights() {
  const a = useAnalytics();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Applications per job" q={a.apps}>{(d) => d.slice(0, 8).map((r) => <Bar key={r.job_id} label={r.title} value={Number(r.total_applications)} max={Math.max(...d.map((x) => Number(x.total_applications)), 1)} />)}</Panel>
        <Panel title="Most requested skills" q={a.skills}>{(d) => d.slice(0, 8).map((r) => <Bar key={r.skill_id} label={r.skill_name} value={Number(r.jobs_requiring)} max={Math.max(...d.map((x) => Number(x.jobs_requiring)), 1)} />)}</Panel>
        <Panel title="Top contractors by jobs posted" q={a.top}>{(d) => d.map((r) => <Bar key={r.contractor_id} label={r.company_name} value={Number(r.jobs_posted)} max={Math.max(...d.map((x) => Number(x.jobs_posted)), 1)} />)}</Panel>
        <Panel title="Average pay by category" q={a.pay}>{(d) => <table className="w-full text-sm"><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{d.map((r, i) => <tr key={i}><td className="py-1.5">{r.category_name}</td><td className="py-1.5 text-xs text-zinc-500">{r.pay_type}</td><td className="py-1.5 text-right"><Mono>{inr(r.avg_pay)}</Mono></td><td className="w-10 py-1.5 text-right"><Mono className="text-xs text-zinc-500">{r.jobs}</Mono></td></tr>)}</tbody></table>}</Panel>
        <div className="lg:col-span-2"><Panel title="Worker ratings" q={a.ratings}>{(d) => <table className="w-full text-sm"><thead><tr className="text-left text-xs text-zinc-500"><th className="pb-2 font-medium">Worker</th><th className="pb-2 text-right font-medium">Average</th><th className="pb-2 text-right font-medium">Range</th><th className="pb-2 text-right font-medium">Ratings</th></tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{d.map((r) => <tr key={r.worker_id}><td className="py-1.5">{r.full_name}</td><td className="py-1.5 text-right"><Mono>{Number(r.avg_score).toFixed(2)}</Mono></td><td className="py-1.5 text-right"><Mono className="text-zinc-500">{r.min_score}–{r.max_score}</Mono></td><td className="py-1.5 text-right"><Mono>{r.total_ratings}</Mono></td></tr>)}</tbody></table>}</Panel></div>
      </div>
    </div>
  );
}
