"use client";

import { useState, type FormEvent } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";

export function ChiefLogin({ error, onLogin, onDevelopmentLogin, onExit }: { error: string | null; onLogin: (personnelNumber: string, password: string) => Promise<boolean>; onDevelopmentLogin: () => boolean; onExit?: () => void }) {
  const [personnelNumber, setPersonnelNumber] = useState("SMTHR000001");
  const [password, setPassword] = useState(process.env.NODE_ENV === "development" ? "1234" : "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await onLogin(personnelNumber, password);
    setLoading(false);
  }

  return (
    <div className="mx-auto grid h-full w-full max-w-[430px] place-items-center px-3">
      <form onSubmit={submit} className="mether-surface w-full rounded-[28px] border border-blue-400/10 p-5 shadow-[0_28px_80px_rgba(0,0,0,.35)]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-400/15 bg-blue-500/10 text-blue-300"><Fingerprint size={22} /></div>
        <div className="mt-5 text-[9px] font-black uppercase tracking-[0.22em] text-blue-400/75">AL METHER · Chief</div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Saha Operasyonları</h1>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">Personel numaranla operasyon konsoluna gir.</p>
        <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/[0.07] bg-black/20 p-1" aria-label="Giriş rolü">
          <button type="button" onClick={onExit} className="h-10 rounded-xl text-[10px] font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-blue-300">CEO</button>
          <button type="button" aria-pressed="true" className="h-10 rounded-xl bg-blue-600 text-[10px] font-black text-white shadow-[0_8px_22px_rgba(37,99,235,.22)]">Şef</button>
        </div>
        <label className="mt-5 block text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Personel No<input value={personnelNumber} onChange={event => setPersonnelNumber(event.target.value.toUpperCase())} autoComplete="username" className="mt-2 h-12 w-full rounded-2xl border border-white/[0.07] bg-black/20 px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/35" /></label>
        <label className="mt-3 block text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Şifre<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-12 w-full rounded-2xl border border-white/[0.07] bg-black/20 px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/35" /></label>
        {error ? <div className="mt-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] px-3 py-2 text-[9px] font-bold text-rose-300">{error}</div> : null}
        <button disabled={loading} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white shadow-[0_14px_35px_rgba(37,99,235,.28)] disabled:opacity-50"><ShieldCheck size={16} />{loading ? "Doğrulanıyor" : "Operasyona Gir"}</button>
        {process.env.NODE_ENV === "development" ? <button type="button" onClick={onDevelopmentLogin} className="mt-2 h-11 w-full rounded-2xl border border-amber-300/15 bg-amber-400/[0.04] text-[9px] font-black text-amber-200/75">Geliştirme Modu · Şifre Olmadan Gir</button> : null}
        <div className="mt-3 text-center text-[8px] text-slate-600">Chief Operations Auth · SMTHR000001</div>
      </form>
    </div>
  );
}
