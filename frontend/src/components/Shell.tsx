import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3, Briefcase, ClipboardList, LogOut, Menu, Users, X,
  UserCircle, Shield, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useTheme } from "@/hooks/theme";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: { to: string; label: string; icon: typeof Briefcase; roles: Role[] }[] = [
  { to: "/jobs", label: "Jobs", icon: Briefcase, roles: ["worker", "contractor", "admin"] },
  { to: "/applications", label: "My applications", icon: ClipboardList, roles: ["worker"] },
  { to: "/workers", label: "Workers", icon: Users, roles: ["contractor", "admin"] },
  { to: "/insights", label: "Insights", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/users", label: "Users", icon: Shield, roles: ["admin"] },
  { to: "/profile", label: "Profile", icon: UserCircle, roles: ["worker", "contractor", "admin"] },
];

export default function Shell() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex-1 space-y-0.5 p-3">
      {NAV.filter((n) => user && n.roles.includes(user.role)).map(({ to, label, icon: I }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80",
              isActive &&
                "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 [&>svg]:text-accent"
            )
          }
        >
          <I className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const side = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
          <Briefcase className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Worksite
        </span>
      </div>
      {links}
      <div className="space-y-1 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <button
          onClick={toggle}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div className="px-2.5 pt-1">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          <p className="font-mono text-xs capitalize text-zinc-400 dark:text-zinc-500">{user?.role}</p>
        </div>
        <button
          onClick={signOut}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113] lg:block">
        {side}
      </aside>
      <header className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-[#111113] lg:hidden">
        <div className="flex items-center">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Menu className="size-5" />
          </button>
          <span className="ml-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Worksite
          </span>
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X className="size-4" />
            </button>
            {side}
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
