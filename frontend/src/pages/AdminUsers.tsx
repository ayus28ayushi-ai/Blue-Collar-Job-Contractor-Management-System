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
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="mt-1 text-sm text-zinc-500">Workers and contractors registered on the platform.</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Workers ({workers.data?.length ?? "…"})</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Expected wage</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {workers.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              )}
              {(workers.data ?? []).map((w) => (
                <tr key={w.worker_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{w.full_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{w.city}</td>
                  <td className="px-4 py-3">{w.experience_years} yrs</td>
                  <td className="px-4 py-3">{inr(w.expected_daily_wage)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.is_available ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {w.is_available ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{fmtDate(w.created_at)}</td>
                </tr>
              ))}
              {!workers.isLoading && (workers.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
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
          <h2 className="font-semibold">Contractors ({contractors.data?.length ?? "…"})</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {contractors.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              )}
              {(contractors.data ?? []).map((c) => (
                <tr key={c.contractor_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{c.company_name}</td>
                  <td className="px-4 py-3">{c.contact_person}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.phone}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.email}</td>
                  <td className="px-4 py-3">{c.city}</td>
                </tr>
              ))}
              {!contractors.isLoading && (contractors.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
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
