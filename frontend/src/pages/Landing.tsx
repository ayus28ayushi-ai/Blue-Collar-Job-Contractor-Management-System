import { Link } from "react-router-dom";
import {
  Briefcase, Users, Shield, Search, FileCheck, TrendingUp,
  Wrench, Building2, ArrowRight, CheckCircle2, MapPin, Clock, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/theme";

export default function Landing() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#09090B] dark:text-zinc-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-[#09090B]/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
              <Wrench className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Worksite
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Features</a>
            <a href="#how" className="hover:text-zinc-900 dark:hover:text-zinc-100">How it works</a>
            <a href="#benefits" className="hover:text-zinc-900 dark:hover:text-zinc-100">Benefits</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link
              to="/login"
              className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-white to-white dark:from-orange-950/30 dark:via-[#09090B] dark:to-[#09090B]" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/50 dark:text-orange-300">
              <span className="size-1.5 rounded-full bg-orange-500" />
              Connecting skilled workers with trusted contractors
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              Find work. Hire talent.
              <br />
              <span className="text-accent">Manage jobs</span> with confidence.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Worksite is the professional platform for blue-collar jobs in India.
              Workers discover opportunities. Contractors post jobs, review applicants,
              and manage their workforce — all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register?role=worker"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover sm:w-auto"
              >
                <Users className="size-4" />
                I&apos;m a Worker
              </Link>
              <Link
                to="/register?role=contractor"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
              >
                <Building2 className="size-4" />
                I&apos;m a Contractor
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Job categories", value: "5+" },
              { label: "Skills tracked", value: "8+" },
              { label: "Roles supported", value: "3" },
              { label: "End-to-end flow", value: "Yes" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{s.value}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-100 bg-zinc-50/80 py-20 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Everything you need to run jobs
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              From discovery to payment and ratings — a complete workflow for workers and contractors.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Search, title: "Job discovery", desc: "Search and filter open jobs by location, category, pay type, and required skills." },
              { icon: FileCheck, title: "Applications & hiring", desc: "Workers apply in one click. Contractors shortlist, accept, or reject with clear status tracking." },
              { icon: Users, title: "Worker profiles & skills", desc: "Profiles with experience, expected wage, availability, and proficiency levels on each skill." },
              { icon: Briefcase, title: "Job posting with skills", desc: "Post jobs with category, pay, dates, headcount, and required skills in a single flow." },
              { icon: TrendingUp, title: "Admin analytics", desc: "Applications per job, top contractors, average pay by category, skill demand, and rating summaries." },
              { icon: Shield, title: "Role-based access", desc: "Secure JWT auth with worker, contractor, and admin roles. Google Sign-In supported." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-accent dark:bg-orange-950/40">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              How Worksite works
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Simple steps for both sides of the marketplace.
            </p>
          </div>
          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            {[
              {
                icon: Users,
                title: "For Workers",
                steps: [
                  "Create an account and complete your profile with skills & experience",
                  "Browse open jobs that match your skills and city",
                  "Apply with one click and track application status",
                  "Get accepted, complete the job, and receive ratings",
                ],
              },
              {
                icon: Building2,
                title: "For Contractors",
                steps: [
                  "Register your company and set up a contractor profile",
                  "Post jobs with required skills, pay, and headcount",
                  "Review applicants, shortlist, and accept the right workers",
                  "Update job status, record payments, and rate completed work",
                ],
              },
            ].map((col) => (
              <div
                key={col.title}
                className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-accent dark:bg-orange-950/50">
                    <col.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{col.title}</h3>
                </div>
                <ol className="space-y-4">
                  {col.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="border-t border-zinc-100 bg-zinc-50/80 py-20 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Built for the real world of blue-collar work
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Worksite focuses on practical needs: clear job details, skill matching,
                application lifecycle, and admin oversight — without unnecessary complexity.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Secure email/password and Google authentication",
                  "Role-based dashboards for workers, contractors, and admins",
                  "Skill matching between jobs and worker profiles",
                  "Application status workflow with capacity limits",
                  "Payments and ratings tied to completed applications",
                  "Analytics for demand, pay, and contractor activity",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: MapPin, title: "Location-aware", text: "Jobs and profiles carry city and location so matching stays practical." },
                { icon: Clock, title: "Clear timelines", text: "Start and end dates on every job; status moves from open → in progress → completed." },
                { icon: Shield, title: "Admin control", text: "Admins can review users, jobs, applications, and platform-wide insights." },
                { icon: TrendingUp, title: "Data-driven", text: "See which skills are in demand and how pay varies by category." },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <c.icon className="size-5 text-accent" />
                  <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{c.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ready to get started?
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Create a free account as a worker or contractor and start using the platform today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Create account <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 items-center rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign in to existing account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
              <Wrench className="size-3.5" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">Worksite</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Blue-Collar Job & Contractor Management System
          </p>
          <div className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link to="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">Sign in</Link>
            <Link to="/register" className="hover:text-zinc-900 dark:hover:text-zinc-100">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
