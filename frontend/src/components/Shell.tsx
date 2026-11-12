import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Briefcase, ClipboardList, LogOut, Menu, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: { to: string; label: string; icon: typeof Briefcase; roles: Role[] }[] = [
  { to: "/jobs", label: "Jobs", icon: Briefcase, roles: ["worker", "contractor", "admin"] },
  { to: "/applications", label: "My applications", icon: ClipboardList, roles: ["worker"] },
  { to: "/workers", label: "Workers", icon: Users, roles: ["contractor", "admin"] },
  { to: "/insights", label: "Insights", icon: BarChart3, roles: ["admin"] },
];

export default function Shell() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const links = (
    <nav className="flex-1 space-y-0.5 p-3">
      {NAV.filter((n) => user && n.roles.includes(user.role)).map(({ to, label, icon: I }) => (
        <NavLink key={to} to={to} onClick={() => setOpen(false)}
          className={({ isActive }) => cn("flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
            isActive && "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 [&>svg]:text-accent")}>
          <I className="size-4" />{label}
        </NavLink>
      ))}
    </nav>
  );
  const side = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5 text-sm font-semibold tracking-tight">Worksite</div>
      {links}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <p className="truncate px-2.5 text-xs text-zinc-500">{user?.email}</p>
        <p className="px-2.5 font-mono text-xs text-zinc-400">{user?.role}</p>
        <button onClick={signOut} className="mt-2 flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"><LogOut className="size-4" />Sign out</button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 bg-white lg:block dark:border-zinc-800 dark:bg-[#111113]">{side}</aside>
      <header className="flex h-12 items-center border-b border-zinc-200 bg-white px-3 lg:hidden dark:border-zinc-800 dark:bg-[#111113]">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Menu className="size-5" /></button>
        <span className="ml-2 text-sm font-semibold tracking-tight">Worksite</span>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-[#111113]">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="size-4" /></button>{side}
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 lg:px-10 lg:py-8"><Outlet /></main>
    </div>
  );
}
