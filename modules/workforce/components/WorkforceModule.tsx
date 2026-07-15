"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { BadgePlus, KeyRound, QrCode, RefreshCw, UserRoundCog, UsersRound } from "lucide-react";
import type { WorkforceMember, WorkforceRole } from "../domain/workforce";
import { createWorkforceMember, listWorkforce } from "../services/workforce-client";

const inputClass = "h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-[11px] text-white outline-none focus:border-blue-400/35";

export function WorkforceModule() {
  const [tab, setTab] = useState<WorkforceRole>("CHIEF");
  const [members, setMembers] = useState<WorkforceMember[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("Saha Personeli");
  const [assignedChiefCode, setAssignedChiefCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{ code: string; password: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chiefs = useMemo(() => members.filter(item => item.role === "CHIEF"), [members]);
  const visible = useMemo(() => members.filter(item => item.role === tab), [members, tab]);
  const selected = members.find(item => item.employeeCode === selectedCode) ?? visible[0];

  async function refresh() {
    try { setMembers(await listWorkforce()); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "HR kayıtları yüklenemedi."); }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!selected?.qrValue) { setQrDataUrl(""); return; }
    void QRCode.toDataURL(selected.qrValue, { width: 280, margin: 2, color: { dark: "#081225", light: "#ffffff" } }).then(setQrDataUrl);
  }, [selected?.qrValue]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setTemporaryPassword(null);
    try {
      const result = tab === "CHIEF"
        ? await createWorkforceMember({ role: "CHIEF", displayName })
        : await createWorkforceMember({ role: "PERSONNEL", displayName, title, assignedChiefCode });
      if (result.temporaryPassword) setTemporaryPassword({ code: result.member.employeeCode, password: result.temporaryPassword });
      setDisplayName(""); setSelectedCode(result.member.employeeCode); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kayıt oluşturulamadı."); }
    finally { setBusy(false); }
  }

  return <div className="grid h-full min-h-0 gap-3 lg:grid-rows-[auto_1fr]">
    <header className="mether-surface flex items-center justify-between rounded-[24px] px-5 py-4"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-400">HR</div><h1 className="mt-1 text-2xl font-black text-white">Şef ve Personel Yönetimi</h1></div><div className="grid grid-cols-2 rounded-2xl border border-white/[.07] bg-black/20 p-1"><button onClick={()=>{setTab("CHIEF");setSelectedCode(null);setTemporaryPassword(null);}} className={`h-10 rounded-xl px-5 text-[10px] font-black ${tab === "CHIEF" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Şef Yönetimi</button><button onClick={()=>{setTab("PERSONNEL");setSelectedCode(null);setTemporaryPassword(null);}} className={`h-10 rounded-xl px-5 text-[10px] font-black ${tab === "PERSONNEL" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Personel Yönetimi</button></div></header>
    <div className="grid min-h-0 gap-3 lg:grid-cols-[330px_minmax(0,1fr)_260px]">
      <form onSubmit={submit} className="mether-surface rounded-[24px] p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{tab === "CHIEF" ? <UserRoundCog size={15}/> : <UsersRound size={15}/>} {tab === "CHIEF" ? "Şef Oluştur" : "Personel Oluştur"}</div><div className="mt-5 space-y-3"><input aria-label="Ad Soyad" required value={displayName} onChange={event=>setDisplayName(event.target.value)} className={inputClass} placeholder="Ad Soyad"/>{tab === "PERSONNEL" ? <><input aria-label="Görev" required value={title} onChange={event=>setTitle(event.target.value)} className={inputClass} placeholder="Görev"/><select aria-label="Şef" required value={assignedChiefCode} onChange={event=>setAssignedChiefCode(event.target.value)} className={inputClass}><option value="">Şef seç</option>{chiefs.filter(chief=>chief.status === "ACTIVE").map(chief=><option key={chief.id} value={chief.employeeCode}>{chief.employeeCode} · {chief.displayName}</option>)}</select></> : null}<button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[10px] font-black text-white disabled:opacity-50"><BadgePlus size={16}/>{busy ? "Kaydediliyor..." : "Oluştur ve Kaydet"}</button></div>{temporaryPassword ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[.08] p-3"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.12em] text-amber-300"><KeyRound size={13}/> Geçici Şifre</div><div className="mt-2 font-mono text-[11px] text-white">{temporaryPassword.code}</div><div className="mt-1 font-mono text-[13px] font-black text-amber-200">{temporaryPassword.password}</div></div> : null}{error ? <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[9px] text-rose-200">{error}</div> : null}</form>
      <section className="mether-surface min-h-0 overflow-hidden rounded-[24px] p-4"><div className="flex items-center justify-between"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{tab === "CHIEF" ? "Şefler" : "Personeller"} · {visible.length}</div><button onClick={()=>void refresh()} className="text-slate-500"><RefreshCw size={14}/></button></div><div className="mether-scroll mt-3 grid max-h-full gap-2 overflow-y-auto pr-1 xl:grid-cols-2">{visible.map(member=><button key={member.id} onClick={()=>setSelectedCode(member.employeeCode)} className={`rounded-2xl border p-3 text-left ${selected?.id === member.id ? "border-blue-400/30 bg-blue-500/[.08]" : "border-white/[.055] bg-black/10"}`}><div className="text-[11px] font-black text-white">{member.displayName}</div><div className="mt-1 text-[10px] font-black text-blue-300">{member.employeeCode}</div><div className="mt-2 text-[8px] text-slate-600">{member.role === "CHIEF" ? member.status : `${member.assignedChiefCode ?? "Şef atanmamış"} · QR hazır`}</div></button>)}{visible.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[.08] p-8 text-center text-[10px] text-slate-600">Henüz kayıt yok.</div> : null}</div></section>
      <aside className="mether-surface rounded-[24px] p-4">{selected ? <><div className="text-[8px] font-black uppercase tracking-[.16em] text-blue-300">Kayıt</div><h2 className="mt-2 text-lg font-black text-white">{selected.displayName}</h2><div className="mt-1 text-[11px] font-black text-blue-300">{selected.employeeCode}</div>{selected.role === "PERSONNEL" ? <><div className="mt-2 text-[9px] text-slate-500">Şef: {selected.assignedChiefCode}</div>{qrDataUrl ? <div className="mt-4 rounded-2xl bg-white p-3"><img src={qrDataUrl} alt={`${selected.employeeCode} QR`} className="mx-auto w-[160px]"/><div className="text-center text-[9px] font-black text-slate-900">{selected.employeeCode}</div></div> : null}<div className="mt-3 flex items-center gap-2 text-[8px] font-black text-emerald-300"><QrCode size={13}/> QR otomatik kaydedildi</div></> : <div className="mt-4 rounded-xl border border-white/[.06] p-3 text-[9px] text-slate-500">Şef, personel numarası ve HR tarafından üretilen geçici şifreyle giriş yapar.</div>}</> : <div className="grid h-full place-items-center text-center text-[9px] text-slate-600">Kayıt seç.</div>}</aside>
    </div>
  </div>;
}
