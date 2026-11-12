import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth";
import { useMe, useCreateWorker, useCreateContractor, useSkills } from "@/hooks/queries";
import { api, ApiError } from "@/lib/api";

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
  const [mySkills, setMySkills] = useState<
    { skill_id: number; skill_name: string; years_experience: number; proficiency: string }[]
  >([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const workerId = me.data?.worker_id ?? null;
  const contractorId = me.data?.contractor_id ?? null;

  useEffect(() => {
    if (!workerId) return;
    setSkillsLoading(true);
    api<typeof mySkills>(`/workers/${workerId}/skills`)
      .then(setMySkills)
      .catch(() => setMySkills([]))
      .finally(() => setSkillsLoading(false));
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
      setYears(0);
      setProficiency("beginner");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add skill");
    }
  }

  const field =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
  const labelCls = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const card =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

  if (me.isLoading) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Your profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {user?.email} · <span className="capitalize">{user?.role}</span>
        </p>
      </div>

      {user?.role === "worker" && (
        <section className={card}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Worker profile</h2>
          {workerId ? (
            <div className="mt-4 space-y-5">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Profile ID: <span className="font-mono text-zinc-800 dark:text-zinc-200">{workerId}</span>
              </p>

              <div>
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Your skills</h3>
                {skillsLoading ? (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading skills…</p>
                ) : mySkills.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No skills added yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                    {mySkills.map((s) => (
                      <li key={s.skill_id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.skill_name}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {s.years_experience}y · {s.proficiency}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={addSkill} className="mt-4 grid gap-3 sm:grid-cols-[1fr_80px_140px_auto] sm:items-end">
                  <div>
                    <label className={labelCls}>Skill</label>
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value ? Number(e.target.value) : "")}
                      className={field}
                      required
                      disabled={skillsQ.isLoading}
                    >
                      <option value="">
                        {skillsQ.isLoading
                          ? "Loading skills…"
                          : skillsQ.isError
                            ? "Failed to load skills"
                            : (skillsQ.data?.length ?? 0) === 0
                              ? "No skills in system — seed the database"
                              : "Select a skill…"}
                      </option>
                      {(skillsQ.data ?? []).map((s) => (
                        <option key={s.skill_id} value={s.skill_id}>
                          {s.skill_name}
                        </option>
                      ))}
                    </select>
                    {skillsQ.isError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Could not load skills. Ensure the API is running and skills are seeded.
                      </p>
                    )}
                    {!skillsQ.isLoading && !skillsQ.isError && (skillsQ.data?.length ?? 0) === 0 && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        Run the seed SQL to populate skills, or ask an admin to add them.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Years</label>
                    <input
                      type="number"
                      min={0}
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Level</label>
                    <select
                      value={proficiency}
                      onChange={(e) => setProficiency(e.target.value as typeof proficiency)}
                      className={field}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={selectedSkill === "" || skillsQ.isLoading}
                    className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form onSubmit={submitWorker} className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Complete your worker profile to apply for jobs.
              </p>
              {(
                [
                  ["full_name", "Full name", "text"],
                  ["phone", "Phone", "text"],
                  ["city", "City", "text"],
                ] as const
              ).map(([key, labelText, type]) => (
                <div key={key}>
                  <label className={labelCls}>{labelText}</label>
                  <input
                    type={type}
                    required
                    value={workerForm[key]}
                    onChange={(e) => setWorkerForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={field}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Experience (years)</label>
                  <input
                    type="number"
                    min={0}
                    value={workerForm.experience_years}
                    onChange={(e) =>
                      setWorkerForm((f) => ({ ...f, experience_years: Number(e.target.value) }))
                    }
                    className={field}
                  />
                </div>
                <div>
                  <label className={labelCls}>Expected daily wage (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={workerForm.expected_daily_wage}
                    onChange={(e) =>
                      setWorkerForm((f) => ({ ...f, expected_daily_wage: Number(e.target.value) }))
                    }
                    className={field}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={workerForm.is_available}
                  onChange={(e) => setWorkerForm((f) => ({ ...f, is_available: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                Currently available for work
              </label>
              <button
                type="submit"
                disabled={createWorker.isPending}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {createWorker.isPending ? "Saving…" : "Create worker profile"}
              </button>
            </form>
          )}
        </section>
      )}

      {user?.role === "contractor" && (
        <section className={card}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Company profile</h2>
          {contractorId ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Company profile ID:{" "}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{contractorId}</span>. You can
              post jobs from the Jobs page.
            </p>
          ) : (
            <form onSubmit={submitContractor} className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Create a company profile before posting jobs.
              </p>
              {(
                [
                  ["company_name", "Company name"],
                  ["contact_person", "Contact person"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["city", "City"],
                ] as const
              ).map(([key, labelText]) => (
                <div key={key}>
                  <label className={labelCls}>{labelText}</label>
                  <input
                    required
                    value={contractorForm[key]}
                    onChange={(e) => setContractorForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={field}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={createContractor.isPending}
                className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {createContractor.isPending ? "Saving…" : "Create company profile"}
              </button>
            </form>
          )}
        </section>
      )}

      {user?.role === "admin" && (
        <section className={card}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Admin account</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You have full access to Insights, user management, and all platform data.
          </p>
        </section>
      )}
    </div>
  );
}
