import type { LoginResponse } from "@/types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "worksite.token";
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

/** Normalised error. `fields` maps a body field name to its message for 422s. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) { super(message); }
  get isNetwork() { return this.status === 0; }
}
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

interface PydanticIssue { loc: (string | number)[]; msg: string }
function parseError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (status === 422 && Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const it of detail as PydanticIssue[]) {
      const path = it.loc.filter((p) => p !== "body");
      const key = path.map(String).join(".") || "_";
      fields[key] ??= it.msg.replace(/^Value error, /, "");
    }
    const first = Object.entries(fields)[0];
    return new ApiError(422, first ? `${first[0] === "_" ? "" : first[0] + ": "}${first[1]}` : "Validation failed", fields);
  }
  if (typeof detail === "string") return new ApiError(status, detail);
  return new ApiError(status, `Request failed (${status})`);
}

type Opts = { method?: string; json?: unknown; form?: Record<string, string>; query?: Record<string, string | number | undefined | null>; auth?: boolean };
export async function api<T>(path: string, o: Opts = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token && o.auth !== false) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (o.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(o.json); }
  if (o.form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(o.form); } // /auth/login is an OAuth2PasswordRequestForm
  let res: Response;
  try { res = await fetch(url, { method: o.method ?? "GET", headers, body }); }
  catch { throw new ApiError(0, "Can't reach the server. Check your connection and try again."); }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && o.auth !== false) onUnauthorized();
    throw parseError(res.status, data);
  }
  return data as T;
}

export const login = (email: string, password: string) => api<LoginResponse>("/auth/login", { method: "POST", form: { username: email, password }, auth: false });
export const register = (email: string, password: string, role: "worker" | "contractor") =>
  api<{ message: string }>("/auth/register", { method: "POST", json: { email, password, role }, auth: false });
