import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { cn, labelOf } from "@/lib/utils";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger"; size?: "sm" | "md"; loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ variant = "outline", size = "md", loading, className, children, disabled, ...p }, ref) => (
  <button ref={ref} disabled={disabled || loading} {...p}
    className={cn("inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none",
      size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
      variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
      variant === "outline" && "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
      variant === "ghost" && "hover:bg-zinc-100 dark:hover:bg-zinc-800",
      variant === "danger" && "border border-zinc-200 text-red-700 hover:bg-red-50 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-950/40", className)}>
    {loading && <Loader2 className="size-3.5 animate-spin" />}{children}
  </button>
));

const inputCls = "w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, r) => <input ref={r} {...p} className={cn(inputCls, "h-9", className)} />);
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, r) => <select ref={r} {...p} className={cn(inputCls, "h-9", className)} />);
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, r) => <textarea ref={r} {...p} className={cn(inputCls, "py-2 min-h-20", className)} />);

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span> : hint ? <span className="mt-1 block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

const tone: Record<string, string> = {
  open: "text-emerald-700 dark:text-emerald-400", applied: "text-zinc-600 dark:text-zinc-400", shortlisted: "text-sky-700 dark:text-sky-400",
  accepted: "text-emerald-700 dark:text-emerald-400", in_progress: "text-amber-700 dark:text-amber-400", completed: "text-zinc-900 dark:text-zinc-100",
  rejected: "text-red-700 dark:text-red-400", cancelled: "text-red-700 dark:text-red-400", withdrawn: "text-zinc-500",
};
export const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", tone[status])}>
    <span className="size-1.5 rounded-full bg-current" />{labelOf(status)}
  </span>
);

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton h-4", className)} />;
export const RowSkeletons = ({ rows = 6 }: { rows?: number }) => (
  <div className="divide-y divide-zinc-200 dark:divide-zinc-800" aria-busy>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex-1 space-y-2"><Skeleton className="w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
        <Skeleton className="w-16" /><Skeleton className="hidden w-20 sm:block" />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ title, body, action }: { title: string; body: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div role="alert" className="m-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
    <AlertCircle className="mt-0.5 size-4 shrink-0" /><p className="flex-1">{message}</p>
    {onRetry && <Button size="sm" onClick={onRetry}>Retry</Button>}
  </div>
);

/** Right-hand slide-over. Esc closes; focus moves in on open. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-zinc-950/30" onClick={onClose} />
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal aria-label={title}
        className="animate-slidein absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white outline-none dark:border-zinc-800 dark:bg-[#111113]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="size-4" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">{footer}</footer>}
      </aside>
    </div>
  );
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cn("font-mono tabular-nums", className)}>{children}</span>;
