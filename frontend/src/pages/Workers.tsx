import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { errMsg, useWorkers } from "@/hooks/queries";
import { useSearchHotkey } from "@/hooks/useSearchHotkey";
import { EmptyState, ErrorBanner, Input, Mono, RowSkeletons } from "@/components/ui";
import { inr } from "@/lib/utils";

export default function Workers() {
  const q = useWorkers(); const [s, setS] = useState(""); const [avail, setAvail] = useState(false);
  const ref = useRef<HTMLInputElement>(null); useSearchHotkey(ref);
  const n = s.trim().toLowerCase();
  const rows = (q.data ?? []).filter((w) => (!avail || w.is_available) && (!n || `${w.full_name} ${w.city} ${w.phone}`.toLowerCase().includes(n)));
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">Workers</h1>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400" />
          <Input ref={ref} value={s} onChange={(e) => setS(e.target.value)} placeholder="Search name, city, phone" className="pl-8" aria-label="Search workers" /></div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"><input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} className="accent-[#C2410C]" />Available only</label>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
        {q.isLoading ? <RowSkeletons /> : q.isError ? <ErrorBanner message={errMsg(q.error)} onRetry={() => q.refetch()} /> : !rows.length ? <EmptyState title="No workers found" body={n || avail ? "Loosen the filters to see more people." : "Workers appear here once they create a profile."} /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800"><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">City</th><th className="px-4 py-2 text-right font-medium">Experience</th><th className="px-4 py-2 text-right font-medium">Daily wage</th><th className="px-4 py-2 font-medium">Phone</th><th className="px-4 py-2 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{rows.map((w) => (
              <tr key={w.worker_id}><td className="px-4 py-2.5 font-medium">{w.full_name}</td><td className="px-4 py-2.5 text-zinc-500">{w.city}</td>
                <td className="px-4 py-2.5 text-right"><Mono>{w.experience_years} yr</Mono></td><td className="px-4 py-2.5 text-right"><Mono>{inr(w.expected_daily_wage)}</Mono></td>
                <td className="px-4 py-2.5"><Mono className="text-xs text-zinc-500">{w.phone}</Mono></td>
                <td className="px-4 py-2.5 text-xs">{w.is_available ? <span className="text-emerald-700 dark:text-emerald-400">Available</span> : <span className="text-zinc-500">Busy</span>}</td></tr>))}</tbody></table>)}
      </div>
    </div>
  );
}
