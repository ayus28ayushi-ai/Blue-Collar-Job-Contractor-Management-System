import { useEffect, type RefObject } from "react";
/** "/" or Cmd/Ctrl+K focuses the search input (unless already typing in a field). */
export function useSearchHotkey(ref: RefObject<HTMLInputElement>) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [ref]);
}
