// Mirrors the FastAPI Pydantic schemas and the raw dict shapes returned by routers.
export type Role = "worker" | "contractor" | "admin";
export interface AuthUser { user_id: number; email: string; role: Role }
export interface LoginResponse { access_token: string; token_type: "bearer"; user: AuthUser }

export type PayType = "daily" | "hourly" | "fixed";
export type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "applied" | "shortlisted" | "accepted" | "rejected" | "withdrawn" | "completed";

export interface Category { category_id: number; category_name: string }
export interface Skill { skill_id: number; skill_name: string }
export interface JobSkill extends Skill { min_years_required: number }

/** Row from GET /contractors/{id}/jobs and POST responses (SELECT j.*) */
export interface JobRow {
  job_id: number; contractor_id: number; category_id: number; title: string;
  description: string | null; location: string; pay_amount: number | string; pay_type: PayType;
  workers_needed: number; start_date: string; end_date: string; status: JobStatus; posted_at?: string;
}
/** Row from GET /jobs/search (no status column, so we tag it client-side). */
export interface JobSearchRow {
  job_id: number; title: string; company_name: string; category_name: string; location: string;
  pay_amount: number | string; pay_type: PayType; workers_needed: number; start_date: string; required_skills: string | null;
}
export interface JobDetail extends JobRow { company_name: string; category_name: string; skills: JobSkill[] }

/** Client-side view model produced by adapters. */
export interface Job {
  contractorId?: number;
  id: number; title: string; company?: string; category?: string; location: string;
  pay: number; payType: PayType; workersNeeded: number; startDate: string; endDate?: string;
  status: JobStatus; skills: string[];
}

export interface JobInput {
  category_id: number; title: string; description?: string | null; location: string; pay_amount: number;
  pay_type: PayType; workers_needed: number; start_date: string; end_date: string;
  skills: { skill_id: number; min_years_required: number }[];
  contractor_id: number; // required by the schema; server ignores it and uses the token
}

export interface Contractor { contractor_id: number; company_name: string; contact_person: string; phone: string; email: string; city: string }
export interface Worker {
  worker_id: number; full_name: string; phone: string; email: string | null; city: string;
  experience_years: number; expected_daily_wage: number | string; is_available: boolean; created_at: string;
}
export interface WorkerInput { full_name: string; phone: string; city: string; experience_years: number; expected_daily_wage: number; is_available: boolean }

export interface JobApplicant { application_id: number; status: ApplicationStatus; applied_at: string; worker_id: number; full_name: string; phone: string; expected_daily_wage: number | string }
export interface MyApplication { application_id: number; status: ApplicationStatus; applied_at: string; job_id: number; title: string; company_name: string; pay_amount: number | string; pay_type: PayType; job_status: JobStatus }

export interface PaymentInput { application_id: number; amount: number; method: "cash" | "upi" | "bank_transfer" }

export interface AppsPerJob { job_id: number; title: string; status: JobStatus; total_applications: number }
export interface TopContractor { contractor_id: number; company_name: string; jobs_posted: number }
export interface AvgPay { category_name: string; pay_type: PayType; jobs: number; avg_pay: number | string }
export interface SkillDemand { skill_id: number; skill_name: string; jobs_requiring: number }
export interface WorkerRating { worker_id: number; full_name: string; total_ratings: number; avg_score: number | string; min_score: number; max_score: number }
