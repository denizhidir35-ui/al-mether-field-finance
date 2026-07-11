import type { AppUser } from "@/types/auth";

const SESSION_KEY = "al_mether_session";

export function readSession(): AppUser | null {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AppUser;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function writeSession(user: AppUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

