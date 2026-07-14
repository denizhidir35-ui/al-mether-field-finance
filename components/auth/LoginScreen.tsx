"use client";

import { useState } from "react";

type LoginScreenProps = {
  onAuthenticate: (email: string, password: string) => Promise<void>;
  onOpenChief?: () => void;
};

function loginErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Giriş yapılamadı.";
}

export function LoginScreen({ onAuthenticate, onOpenChief }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAuthenticate(email, password);
    } catch (loginError) {
      setError(loginErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="mether-surface w-full max-w-[390px] rounded-[28px] p-6 sm:p-7">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_35px_rgba(59,130,246,.32)]" />
        <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">AL METHER</div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Company Platform</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Şirket mailinle giriş yap. Kimlik ve yetkiler oturumdan otomatik belirlenir.</p>
        <div className="mt-6 space-y-2.5">
          <input value={email} onChange={event => setEmail(event.target.value)} className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="Şirket maili" autoComplete="username" />
          <input value={password} onChange={event => setPassword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") login(); }} type="password" className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="Şifre" autoComplete="current-password" />
          {error ? <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">{error}</p> : null}
          <button type="button" disabled={submitting} onClick={login} className="h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">{submitting ? "Giriş yapılıyor..." : "Giriş Yap"}</button>
          {onOpenChief ? <button type="button" onClick={onOpenChief} className="h-11 w-full rounded-xl border border-blue-400/15 bg-blue-500/[0.05] text-xs font-bold text-blue-300 transition hover:bg-blue-500/10">Personel No ile Şef Girişi</button> : null}
        </div>
        <div className="mt-4 text-[10px] text-slate-700">Supabase Auth ile güvenli şirket oturumu</div>
      </section>
    </main>
  );
}
