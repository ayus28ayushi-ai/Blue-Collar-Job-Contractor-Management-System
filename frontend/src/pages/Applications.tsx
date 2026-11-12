import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { errMsg, useMyApplications, useMyWorkerId, useRate, useWithdraw } from "@/hooks/queries";
import { Button, EmptyState, ErrorBanner, Mono, RowSkeletons, StatusBadge } from "@/components/ui";
import { ProfileSetup } from "@/components/Profile";
import { fmtDate, inr } from "@/lib/utils";
import type { MyApplication } from "@/types";

function RateInline({ a }: { a: MyApplication }) {
  const rate = useRate(); const [score, setScore] = useState(0); const [done, setDone] = useState(false);
  if (done) return <span className="text-xs text-zinc-500">Rated {score}/5</span>;
  return (
    <span className="inline-flex items-center gap-0.5" role="group" aria-label="Rate this job">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} aria-label={`${n} stars`} disabled={rate.isPending} onClick={() => { setScore(n); rate.mutate({ application_id: a.application_id, score: n }, { onSuccess: () => setDone(true) }); }}
          className="p-0.5 text-zinc-300 hover:text-amber-500"><Star className="size-4" /></button>))}
    </span>
  );
}

export default function Applications() {
  const me = useMyWorkerId();
  const wid = me.workerId ?? null;
  const q = useMyApplications(wid); const withdraw = useWithdraw(wid);

  if (me.isLoading) return <div className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]"><RowSkeletons rows={3} /></div>;
  if (me.isError) return <ErrorBanner message={errMsg(me.error)} onRetry={() => me.refetch()} />;
  if (wid === null) return <ProfileSetup kind="worker" />; // /auth/me says this worker has no profile row yet
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">My applications</h1>
      <div className="mt-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
        {q.isLoading ? <RowSkeletons rows={4} /> : q.isError ? <ErrorBanner message={errMsg(q.error)} onRetry={() => q.refetch()} /> :
          !q.data?.length ? <EmptyState title="You haven't applied to anything" body="Find an open job and apply in one click." action={<Link to="/jobs"><Button variant="primary">Browse open jobs</Button></Link>} /> : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {q.data.map((a) => (
                <li key={a.application_id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1"><Link to={`/jobs?status=${a.job_status}&job=${a.job_id}`} className="truncate text-sm font-medium hover:underline">{a.title}</Link>
                    <p className="text-xs text-zinc-500">{a.company_name} · applied <Mono>{fmtDate(a.applied_at)}</Mono></p></div>
                  <Mono className="hidden text-sm sm:block">{inr(a.pay_amount)}</Mono>
                  <StatusBadge status={a.status} />
                  {a.status === "completed" && <RateInline a={a} />}
                  {(a.status === "applied" || a.status === "shortlisted") && <Button size="sm" variant="danger" onClick={() => withdraw.mutate(a.application_id)}>Withdraw</Button>}
                </li>))}
            </ul>)}
      </div>
    </div>
  );
}
