import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { fromRow, fromSearch } from "@/lib/adapters";
import { useAuth } from "./auth";
import type * as T from "@/types";

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");
const STATUSES: T.JobStatus[] = ["open", "in_progress", "completed", "cancelled"];

// ---------- reference data ----------
export const useCategories = () => useQuery({ queryKey: ["categories"], staleTime: 5 * 60_000, queryFn: () => api<T.Category[]>("/categories/") });
export const useSkills = () => useQuery({ queryKey: ["skills"], staleTime: 5 * 60_000, queryFn: () => api<T.Skill[]>("/skills") });

// ---------- profiles ----------
// GET /auth/me returns the logged-in user plus their worker_id / contractor_id (null until a profile exists).
export interface Me { user_id: number; email: string; role: T.Role; worker_id: number | null; contractor_id: number | null }
export const useMe = () => {
  const { user } = useAuth();
  return useQuery({ queryKey: ["me", user?.user_id], enabled: !!user, staleTime: 60_000, queryFn: () => api<Me>("/auth/me") });
};
/** data: undefined while loading, null when the contractor has no company profile yet, else { contractor_id }. */
export function useMyContractor() {
  const q = useMe();
  return { ...q, data: q.data ? (q.data.contractor_id === null ? null : { contractor_id: q.data.contractor_id }) : undefined };
}
/** Same idea for workers. */
export const useMyWorkerId = () => {
  const q = useMe();
  return { ...q, workerId: q.data ? q.data.worker_id : undefined };
};

export function useCreateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<T.Contractor, "contractor_id">) => api<T.Contractor>("/contractors/", { method: "POST", json: b }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); toast.success("Company profile created"); },
  });
}
export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: T.WorkerInput) => api<T.Worker>("/workers", { method: "POST", json: b }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); toast.success("Profile created"); },
  });
}

// ---------- jobs ----------
export interface JobFilters { status: T.JobStatus | "all"; q: string; mine: boolean }
export function useJobs(f: JobFilters) {
  const mine = useMyContractor();
  const cid = mine.data?.contractor_id;
  return useQuery({
    queryKey: ["jobs", f.status, f.mine ? cid : "public"],
    enabled: !f.mine || cid !== undefined,
    queryFn: async (): Promise<T.Job[]> => {
      if (f.mine && cid) {
        const rows = await api<T.JobRow[]>(`/contractors/${cid}/jobs`);
        return rows.map(fromRow).filter((j) => f.status === "all" || j.status === f.status);
      }
      // /jobs/search is the only list endpoint and filters by one status at a time.
      const wanted = f.status === "all" ? STATUSES : [f.status];
      const all = await Promise.all(wanted.map(async (s) => (await api<T.JobSearchRow[]>("/jobs/search", { query: { status: s } })).map((r) => fromSearch(r, s))));
      return all.flat().sort((a, b) => b.pay - a.pay);
    },
  });
}
export const useJob = (id: number | null) => useQuery({ queryKey: ["job", id], enabled: id !== null, queryFn: async () => fromRow(await api<T.JobDetail>(`/jobs/${id}`)) });

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: T.JobInput) => api<T.JobRow>("/jobs/with-skills", { method: "POST", json: b }),
    onSuccess: (j) => { qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success(`Posted "${j.title}"`); },
  });
}
/** Contractor transitions. in_progress/completed use PATCH; cancel is only reachable through PUT. */
export function useJobStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: T.JobStatus }) =>
      status === "cancelled" ? api(`/jobs/${id}/status`, { method: "PUT", json: { status } }) : api(`/jobs/${id}/status`, { method: "PATCH", json: { status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["jobs"] });
      const snap = qc.getQueriesData<T.Job[]>({ queryKey: ["jobs"] });
      qc.setQueriesData<T.Job[]>({ queryKey: ["jobs"] }, (old) => old?.map((j) => (j.id === id ? { ...j, status } : j)));
      qc.setQueryData<T.Job>(["job", id], (j) => (j ? { ...j, status } : j));
      return { snap };
    },
    onError: (e, _v, ctx) => { ctx?.snap.forEach(([k, d]) => qc.setQueryData(k, d)); toast.error(errMsg(e)); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); qc.invalidateQueries({ queryKey: ["job"] }); qc.invalidateQueries({ queryKey: ["applicants"] }); },
    onSuccess: (_d, v) => toast.success(`Job marked ${v.status.replace("_", " ")}`),
  });
}

// ---------- applications ----------
export const useApplicants = (jobId: number | null, enabled: boolean) =>
  useQuery({ queryKey: ["applicants", jobId], enabled: enabled && jobId !== null, queryFn: () => api<T.JobApplicant[]>(`/jobs/${jobId}/applications`) });

export function useSetApplicationStatus(jobId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "shortlisted" | "accepted" | "rejected" | "withdrawn" }) =>
      api(`/applications/${id}/status`, { method: "PATCH", json: { status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["applicants", jobId] });
      const prev = qc.getQueryData<T.JobApplicant[]>(["applicants", jobId]);
      qc.setQueryData<T.JobApplicant[]>(["applicants", jobId], (o) => o?.map((a) => (a.application_id === id ? { ...a, status } : a)));
      return { prev };
    },
    onError: (e, _v, ctx) => { qc.setQueryData(["applicants", jobId], ctx?.prev); toast.error(errMsg(e)); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["applicants", jobId] }),
  });
}
export const useMyApplications = (workerId: number | null) =>
  useQuery({ queryKey: ["my-apps", workerId], enabled: workerId !== null, queryFn: () => api<T.MyApplication[]>(`/workers/${workerId}/applications`) });

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job_id: number) => api("/applications", { method: "POST", json: { job_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-apps"] }); toast.success("Application sent"); },
    onError: (e) => toast.error(errMsg(e)),
  });
}
export function useWithdraw(workerId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/applications/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["my-apps", workerId] });
      const prev = qc.getQueryData<T.MyApplication[]>(["my-apps", workerId]);
      qc.setQueryData<T.MyApplication[]>(["my-apps", workerId], (o) => o?.filter((a) => a.application_id !== id));
      return { prev };
    },
    onError: (e, _id, ctx) => { qc.setQueryData(["my-apps", workerId], ctx?.prev); toast.error(errMsg(e)); },
    onSuccess: () => toast.success("Application withdrawn"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["my-apps", workerId] }),
  });
}
export const useRate = () => useMutation({
  mutationFn: (b: { application_id: number; score: number; comment?: string }) => api("/ratings", { method: "POST", json: b }),
  onSuccess: () => toast.success("Rating submitted"), onError: (e) => toast.error(errMsg(e)),
});
export const usePay = () => useMutation({
  mutationFn: (b: T.PaymentInput) => api("/payments", { method: "POST", json: b }),
  onSuccess: () => toast.success("Payment recorded"), onError: (e) => toast.error(errMsg(e)),
});

// ---------- workers & analytics ----------
export const useWorkers = () => useQuery({ queryKey: ["workers"], queryFn: () => api<T.Worker[]>("/workers") });
export const useAnalytics = () => {
  const q = <D,>(key: string, path: string) => useQuery({ queryKey: ["analytics", key], queryFn: () => api<D>(path) });
  return {
    apps: q<T.AppsPerJob[]>("apps", "/analytics/applications-per-job"),
    top: q<T.TopContractor[]>("top", "/analytics/top-contractors?limit=5"),
    pay: q<T.AvgPay[]>("pay", "/analytics/average-pay-by-category"),
    skills: q<T.SkillDemand[]>("skills", "/analytics/most-requested-skills"),
    ratings: q<T.WorkerRating[]>("ratings", "/analytics/worker-rating-summary"),
  };
};
