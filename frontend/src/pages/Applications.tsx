import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { errMsg, getWorkerId, setWorkerId, useMyApplications, useRate, useWithdraw } from "@/hooks/queries";
import { Button, EmptyState, ErrorBanner, Input, Mono, RowSkeletons, StatusBadge } from "@/components/ui";
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
  const { user } = useAuth();
  const [wid, setWid] = useState<number | null>(() => getWorkerId(user!.user_id));
  const [manual, setManual] = useState(""); const [hasProfile, setHasProfile] = useState(false);
  const q = useMyApplications(wid); const withdraw = useWithdraw(wid);

  // No "me" endpoint exists for workers, so offer a way back in if local storage was cleared.
  if (wid === null) {
    return hasProfile ? (
      <form className="mx-auto max-w-sm space-y-3 py-10" onSubmit={(e) => { e.preventDefault(); const n = Number(manual); if (n > 0) { setWorkerId(user!.user_id, n); setWid(n); } }}>
        <h1 className="text-lg font-semibold tracking-tight">Find your profile</h1>
        <p className="text-sm text-zinc-500">This device doesn't remember your worker ID. Enter it to see your applications.</p>
        <Input type="number" min={1} required value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Worker ID" className="font-mono" />
        <div className="flex gap-2"><Button type="submit" variant="primary">Continue</Button><Button type="button" onClick={() => setHasProfile(false)}>Create a new profile</Button></div>
      </form>
    ) : (
      <div>
        <ProfileSetup kind="worker" onCreated={setWid} />
        <p className="mx-auto max-w-sm text-center text-xs text-zinc-500">Already have a profile?{" "}
          <button className="underline" onClick={() => setHasProfile(true)}>Enter your worker ID</button></p>
      </div>);
  }
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
