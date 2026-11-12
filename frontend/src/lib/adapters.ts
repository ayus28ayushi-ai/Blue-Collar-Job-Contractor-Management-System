import type { Job, JobDetail, JobRow, JobSearchRow, JobStatus } from "@/types";
export const fromSearch = (r: JobSearchRow, status: JobStatus): Job => ({
  id: r.job_id, title: r.title, company: r.company_name, category: r.category_name, location: r.location,
  pay: Number(r.pay_amount), payType: r.pay_type, workersNeeded: r.workers_needed, startDate: r.start_date, status,
  skills: r.required_skills ? r.required_skills.split(", ") : [],
});
export const fromRow = (r: JobRow | JobDetail): Job => ({
  id: r.job_id, contractorId: r.contractor_id, title: r.title, company: (r as JobDetail).company_name, category: (r as JobDetail).category_name, location: r.location,
  pay: Number(r.pay_amount), payType: r.pay_type, workersNeeded: r.workers_needed, startDate: r.start_date, endDate: r.end_date,
  status: r.status, skills: (r as JobDetail).skills?.map((s) => s.skill_name) ?? [],
});
