"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type LoginScreenProps = {
  onAuthenticate: (email: string, password: string) => Promise<void>;
  onEmployeeLogin?: (phone: string, password: string) => Promise<void>;
  onEmployeeActivationRequest?: (phone: string) => Promise<void>;
  onEmployeeActivate?: (phone: string, token: string, password: string) => Promise<void>;
  onOpenChief?: () => void;
  onDevelopmentLogin?: (code: "CMTHR01" | "CMTHR02") => void;
};

function loginErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Invalid login credentials") return "E-posta veya şifre hatalı.";
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Giriş yapılamadı.";
}

export function LoginScreen({ onAuthenticate, onEmployeeLogin, onEmployeeActivationRequest, onEmployeeActivate, onOpenChief, onDevelopmentLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<"company" | "employee">("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [activation, setActivation] = useState(false);
  const [otp, setOtp] = useState("");

  async function login() {
    if (submitting) return;
    const normalizedEmail = email.trim();
    if (/^MTHR\d+$/i.test(normalizedEmail)) {
      setError("Bu bir personel numarası. Üstten Şef rolünü seçerek giriş yap.");
      return;
    }
    if (!normalizedEmail.includes("@")) {
      setError("Geçerli şirket e-postanı gir.");
      return;
    }
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

  async function employeeLogin() {
    if (!onEmployeeLogin || submitting) return;
    setSubmitting(true); setError(null);
    try { await onEmployeeLogin(phone, password); }
    catch (loginError) { setError(loginErrorMessage(loginError)); }
    finally { setSubmitting(false); }
  }

  async function requestActivation() {
    if (!onEmployeeActivationRequest || submitting) return;
    setSubmitting(true); setError(null);
    try { await onEmployeeActivationRequest(phone); setActivation(true); }
    catch (activationError) { setError(loginErrorMessage(activationError)); }
    finally { setSubmitting(false); }
  }

  async function completeActivation() {
    if (!onEmployeeActivate || submitting) return;
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalıdır."); return; }
    setSubmitting(true); setError(null);
    try { await onEmployeeActivate(phone, otp, password); }
    catch (activationError) { setError(loginErrorMessage(activationError)); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <section className="mether-surface w-full max-w-[390px] rounded-[28px] p-6 sm:p-7">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_35px_rgba(59,130,246,.32)]" />
        <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">AL METHER</div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Company Platform</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Rolünü seç. Kimlik ve yetkiler güvenli oturumdan otomatik belirlenir.</p>
        <div className="mt-5 grid grid-cols-3 rounded-2xl border border-white/[0.07] bg-black/20 p-1" aria-label="Giriş rolü">
          <button type="button" onClick={() => { setMode("company"); setError(null); }} aria-pressed={mode === "company"} className={`h-10 rounded-xl text-xs font-black ${mode === "company" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Şirket</button>
          <button type="button" onClick={onOpenChief} className="h-10 rounded-xl text-xs font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-blue-300">Şef</button>
          <button type="button" onClick={() => { setMode("employee"); setError(null); }} aria-pressed={mode === "employee"} className={`h-10 rounded-xl text-xs font-black ${mode === "employee" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Çalışan</button>
        </div>
        <div className="mt-6 space-y-2.5">
          <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">{mode === "company" ? "Şirket Hesabı" : "Çalışan Portalı"}</div>
          {mode === "company" ? <><input value={email} onChange={event => { setEmail(event.target.value); setError(null); }} className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="Şirket e-postası" autoComplete="username" /><input value={password} onChange={event => setPassword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") login(); }} type="password" className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="Şifre" autoComplete="current-password" /></> : <><input value={phone} onChange={event => setPhone(event.target.value)} className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="+90 5xx xxx xx xx" inputMode="tel" autoComplete="tel"/>{activation ? <input value={otp} onChange={event => setOtp(event.target.value)} className="mether-input h-11 rounded-xl px-3 text-sm" placeholder="SMS doğrulama kodu" inputMode="numeric"/> : null}<input value={password} onChange={event => setPassword(event.target.value)} type="password" className="mether-input h-11 rounded-xl px-3 text-sm" placeholder={activation ? "Yeni şifre (en az 8 karakter)" : "Şifre"} autoComplete={activation ? "new-password" : "current-password"}/></>}
          {error ? <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">{error}</p> : null}
          <button type="button" disabled={submitting} onClick={mode === "company" ? login : activation ? completeActivation : employeeLogin} className="h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">{submitting ? "İşleniyor..." : activation ? "Telefonu Doğrula ve Şifreyi Belirle" : "Giriş Yap"}</button>
          {mode === "employee" && !activation ? <button type="button" disabled={submitting} onClick={requestActivation} className="h-10 w-full rounded-xl border border-blue-400/15 text-[10px] font-bold text-blue-300">İlk Aktivasyon</button> : null}
        </div>
        <div className="mt-4 text-[10px] text-slate-700">CEO: Supabase Auth · Şef: Operations Auth</div>
        {process.env.NODE_ENV === "development" && onDevelopmentLogin ? <div className="mt-4 border-t border-white/[0.06] pt-4"><div className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-300/60">Yalnızca geliştirme</div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => onDevelopmentLogin("CMTHR01")} className="h-10 rounded-xl border border-white/[0.07] text-[9px] font-bold text-slate-300">CMTHR01 · Deniz</button><button type="button" onClick={() => onDevelopmentLogin("CMTHR02")} className="h-10 rounded-xl border border-white/[0.07] text-[9px] font-bold text-slate-300">CMTHR02 · Aytaç</button></div></div> : null}
      </section>
    </main>
  );
}
