import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth";
import { useMe, useCreateWorker, useCreateContractor, useSkills } from "@/hooks/queries";
import { api, ApiError } from "@/lib/api";
import { cn, inr } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();
  const me = useMe();
  const skillsQ = useSkills();
  const createWorker = useCreateWorker();
  const createContractor = useCreateContractor();

  const [workerForm, setWorkerForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    experience_years: 0,
    expected_daily_wage: 0,
    is_available: true,
  });
  const [contractorForm, setContractorForm] = useState({
    company_name: "",
    contact_person: "",
    phone: "",
    email: user?.email ?? "",
    city: "",
  });
  const [selectedSkill, setSelectedSkill] = useState<number | "">("");
  const [years, setYears] = useState(0);
  const [proficiency, setProficiency] = useState<"beginner" | "intermediate" | "expert">("beginner");
  const [mySkills, setMySkills] = useState<{ skill_id: number; skill_name: string; years_experience: number; proficiency: string }[]>([]);

  const workerId = me.data?.worker_id ?? null;
  const contractorId = me.data?.contractor_id ?? null;

  useEffect(() => {
    if (workerId) {
      api<typeof mySkills>(`/workers/${workerId}/skills`)
        .then(setMySkills)
        .catch(() => {});
    }
  }, [workerId]);

  async function submitWorker(e: FormEvent) {
    e.preventDefault();
    try {
      await createWorker.mutateAsync(workerForm);
      toast.success("Worker profile created");
      me.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create profile");
    }
  }

  async function submitContractor(e: FormEvent) {
    e.preventDefault();
    try {
      await createContractor.mutateAsync(contractorForm);
      toast.success("Company profile created");
      me.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create profile");
    }
  }

  async function addSkill(e: FormEvent) {
    e.preventDefault();
    if (!workerId || selectedSkill === "") return;
    try {
      await api(`/workers/${workerId}/skills`, {
        method: "POST",
        json: { skill_id: selectedSkill, years_experience: years, proficiency },
      });
      toast.success("Skill added");
      const updated = await api<typeof mySkills>(`/workers/${workerId}/skills`);
      setMySkills(updated);
      setSelectedSkill("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add skill");
    }
  }

  if (me.isLoading) {
    return <div className="text-sm text-zinc-500">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user?.email} · <span className="capitalize">{user?.role}</span>
        </p>
      </div>

      {/* Worker profile */}
      {user?.role === "worker" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Worker profile</h2>
          {workerId ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-600">
                Profile ID: <span className="font-mono">{workerId}</span>
              </p>
              <div>
                <h3 className="text-sm font-medium text-zinc-700">Your skills</h3>
                {mySkills.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500">No skills added yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                    {mySkills.map((s) => (
                      <li key={s.skill_id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="font-medium">{s.skill_name}</span>
                        <span className="text-zinc-500">
                          {s.years_experience}y · {s.proficiency}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <form onSubmit={addSkill} className="mt-4 flex flex-wrap items-end gap-2">
                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">Skill</label>
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value ? Number(e.target.value) : "")}
                      className="h-9 w-full rounded-lg border border-zinc-300 px-2 text-sm"
                      required
                    >
                      <option value="">Select…</option>
                      {(skillsQ.data ?? []).map((s) => (
                        <option key={s.skill_id} value={s.skill_id}>
                          {s.skill_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Years</label>
                    <input
                      type="number"
                      min={0}
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Level</label>
                    <select
                      value={proficiency}
                      onChange={(e) => setProficiency(e.target.value as typeof proficiency)}
                      className="h-9 rounded-lg border border-zinc-300 px-2 text-sm"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <button type="submit" className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover">
                    Add
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form onSubmit={submitWorker} className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600">Complete your worker profile to apply for jobs.</p>
              {(
                [
                  ["full_name", "Full name", "text"],
                  ["phone", "Phone", "text"],
                  ["city", "City", "text"],
                ] as const
              ).map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    required
                    value={workerForm[key]}
                    onChange={(e) => setWorkerForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Experience (years)</label>
                  <input
                    type="number"
                    min={0}
                    value={workerForm.experience_years}
                    onChange={(e) => setWorkerForm((f) => ({ ...f, experience_years: Number(e.target.value) }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Expected daily wage (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={workerForm.expected_daily_wage}
                    onChange={(e) => setWorkerForm((f) => ({ ...f, expected_daily_wage: Number(e.target.value) }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workerForm.is_available}
                  onChange={(e) => setWorkerForm((f) => ({ ...f, is_available: e.target.checked }))}
                />
                Currently available for work
              </label>
              <button
                type="submit"
                disabled={createWorker.isPending}
                className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {createWorker.isPending ? "Saving…" : "Create worker profile"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* Contractor profile */}
      {user?.role === "contractor" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Company profile</h2>
          {contractorId ? (
            <p className="mt-3 text-sm text-zinc-600">
              Company profile ID: <span className="font-mono">{contractorId}</span>. You can post jobs from the Jobs page.
            </p>
          ) : (
            <form onSubmit={submitContractor} className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600">Create a company profile before posting jobs.</p>
              {(
                [
                  ["company_name", "Company name"],
                  ["contact_person", "Contact person"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["city", "City"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    required
                    value={contractorForm[key]}
                    onChange={(e) => setContractorForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={createContractor.isPending}
                className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {createContractor.isPending ? "Saving…" : "Create company profile"}
              </button>
            </form>
          )}
        </section>
      )}

      {user?.role === "admin" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Admin account</h2>
          <p className="mt-2 text-sm text-zinc-600">
            You have full access to Insights, user management, and all platform data.
          </p>
        </section>
      )}
    </div>
  );
}
