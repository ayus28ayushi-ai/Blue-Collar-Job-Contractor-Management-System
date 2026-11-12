import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Worker, Contractor } from "@/types";
import { inr, fmtDate } from "@/lib/utils";

export default function AdminUsers() {
  const workers = useQuery({
    queryKey: ["admin-workers"],
    queryFn: () => api<Worker[]>("/workers"),
  });
  const contractors = useQuery({
    queryKey: ["admin-contractors"],
    queryFn: () => api<Contractor[]>("/contractors/"),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          User management
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Workers and contractors registered on the platform.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Workers ({workers.data?.length ?? "…"})
          </h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Expected wage</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {workers.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Loading…
                  </td>
                </tr>
              )}
              {(workers.data ?? []).map((w) => (
                <tr key={w.worker_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{w.full_name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{w.city}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{w.experience_years} yrs</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{inr(w.expected_daily_wage)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.is_available
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {w.is_available ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{fmtDate(w.created_at)}</td>
                </tr>
              ))}
              {!workers.isLoading && (workers.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No workers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Contractors ({contractors.data?.length ?? "…"})
          </h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {contractors.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Loading…
                  </td>
                </tr>
              )}
              {(contractors.data ?? []).map((c) => (
                <tr key={c.contractor_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{c.company_name}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{c.contact_person}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.phone}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{c.city}</td>
                </tr>
              ))}
              {!contractors.isLoading && (contractors.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No contractors yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
