"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { BadgePlus, KeyRound, QrCode, RefreshCw, UserRoundCog, UsersRound } from "lucide-react";
import type { WorkforceMember, WorkforceRole } from "../domain/workforce";
import { createWorkforceMember, listWorkforce, resetChiefPin, updatePersonnelChief } from "../services/workforce-client";

const inputClass = "h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-[11px] text-white outline-none focus:border-blue-400/35";

export function WorkforceModule() {
  const [tab, setTab] = useState<WorkforceRole>("CHIEF");
  const [members, setMembers] = useState<WorkforceMember[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("Saha Personeli");
  const [assignedChiefCode, setAssignedChiefCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [editChiefCode, setEditChiefCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chiefs = useMemo(() => members.filter(item => item.role === "CHIEF"), [members]);
  const activeChiefs = useMemo(() => chiefs.filter(chief => chief.status === "ACTIVE"), [chiefs]);
  const visible = useMemo(() => members.filter(item => item.role === tab), [members, tab]);
  const selected = members.find(item => item.employeeCode === selectedCode) ?? visible[0];

  async function refresh(preferredCode?: string) {
    try {
      const next = await listWorkforce();
      setMembers(next);
      if (preferredCode) setSelectedCode(preferredCode);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "HR kayıtları yüklenemedi.");
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    setEditChiefCode(selected?.role === "PERSONNEL" ? selected.assignedChiefCode ?? "" : "");
    if (!selected?.qrValue) { setQrDataUrl(""); return; }
    void QRCode.toDataURL(selected.qrValue, { width: 280, margin: 2, color: { dark: "#081225", light: "#ffffff" } }).then(setQrDataUrl);
  }, [selected?.assignedChiefCode, selected?.employeeCode, selected?.qrValue, selected?.role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = tab === "CHIEF"
        ? await createWorkforceMember({ role: "CHIEF", displayName })
        : await createWorkforceMember({ role: "PERSONNEL", displayName, title, assignedChiefCode });
      setDisplayName("");
      await refresh(result.member.employeeCode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kayıt oluşturulamadı.");
    } finally { setBusy(false); }
  }

  async function changePersonnelChief() {
    if (!selected || selected.role !== "PERSONNEL" || !editChiefCode) return;
    setBusy(true);
    try { await updatePersonnelChief(selected.employeeCode, editChiefCode); await refresh(selected.employeeCode); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Şef ataması değiştirilemedi."); }
    finally { setBusy(false); }
  }

  async function changeChiefPin() {
    if (!selected || selected.role !== "CHIEF") return;
    setBusy(true);
    try { await resetChiefPin(selected.employeeCode); await refresh(selected.employeeCode); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "PIN sıfırlanamadı."); }
    finally { setBusy(false); }
  }

  function changeTab(next: WorkforceRole) {
    setTab(next);
    setSelectedCode(null);
    setError("");
  }

  return <div className="grid h-full min-h-0 gap-3 lg:grid-rows-[auto_1fr]">
    <header className="mether-surface flex items-center justify-between rounded-[24px] px-5 py-4"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-400">HR</div><h1 className="mt-1 text-2xl font-black text-white">Şef ve Personel Yönetimi</h1></div><div className="grid grid-cols-2 rounded-2xl border border-white/[.07] bg-black/20 p-1"><button onClick={() => changeTab("CHIEF")} className={`h-10 rounded-xl px-5 text-[10px] font-black ${tab === "CHIEF" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Şef Yönetimi</button><button onClick={() => changeTab("PERSONNEL")} className={`h-10 rounded-xl px-5 text-[10px] font-black ${tab === "PERSONNEL" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Personel Yönetimi</button></div></header>
    <div className="grid min-h-0 gap-3 lg:grid-cols-[330px_minmax(0,1fr)_280px]">
      <form onSubmit={submit} className="mether-surface rounded-[24px] p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{tab === "CHIEF" ? <UserRoundCog size={15}/> : <UsersRound size={15}/>} {tab === "CHIEF" ? "Şef Oluştur" : "Personel Oluştur"}</div><div className="mt-5 space-y-3"><input aria-label="Ad Soyad" required value={displayName} onChange={event => setDisplayName(event.target.value)} className={inputClass} placeholder="Ad Soyad"/>{tab === "PERSONNEL" ? <><input aria-label="Görev" required value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Görev"/><select aria-label="Şef" required value={assignedChiefCode} onChange={event => setAssignedChiefCode(event.target.value)} className={inputClass}><option value="">Şef seç</option>{activeChiefs.map(chief => <option key={chief.id} value={chief.employeeCode}>{chief.employeeCode} · {chief.displayName}</option>)}</select></> : null}<button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[10px] font-black text-white disabled:opacity-50"><BadgePlus size={16}/>{busy ? "Kaydediliyor..." : "Oluştur ve Kaydet"}</button></div>{error ? <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[9px] text-rose-200">{error}</div> : null}</form>

      <section className="mether-surface min-h-0 overflow-hidden rounded-[24px] p-4"><div className="flex items-center justify-between"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{tab === "CHIEF" ? "Şefler" : "Personeller"} · {visible.length}</div><button onClick={() => void refresh()} className="text-slate-500"><RefreshCw size={14}/></button></div><div className="mether-scroll mt-3 grid max-h-full gap-2 overflow-y-auto pr-1 xl:grid-cols-2">{visible.map(member => <button key={member.id} onClick={() => setSelectedCode(member.employeeCode)} className={`rounded-2xl border p-3 text-left ${selected?.id === member.id ? "border-blue-400/30 bg-blue-500/[.08]" : "border-white/[.055] bg-black/10"}`}><div className="text-[11px] font-black text-white">{member.displayName}</div><div className="mt-1 text-[10px] font-black text-blue-300">{member.employeeCode}</div>{member.role === "CHIEF" ? <><div className="mt-2 text-[8px] text-slate-600">{member.status}</div><div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-400/15 bg-amber-400/[.06] px-2 py-1.5 font-mono text-[11px] font-black text-amber-200"><KeyRound size={12}/> PIN: {member.temporaryPin ?? "----"}</div></> : <div className="mt-2 text-[8px] text-slate-600">{member.assignedChiefCode ?? "Şef atanmamış"} · QR hazır</div>}</button>)}{visible.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[.08] p-8 text-center text-[10px] text-slate-600">Henüz kayıt yok.</div> : null}</div></section>

      <aside className="mether-surface rounded-[24px] p-4">{selected ? <><div className="text-[8px] font-black uppercase tracking-[.16em] text-blue-300">Kayıt</div><h2 className="mt-2 text-lg font-black text-white">{selected.displayName}</h2><div className="mt-1 text-[11px] font-black text-blue-300">{selected.employeeCode}</div>{selected.role === "PERSONNEL" ? <><label className="mt-4 block text-[8px] font-black uppercase tracking-[.12em] text-slate-500">Atanmış Şef<select value={editChiefCode} onChange={event => setEditChiefCode(event.target.value)} className={`mt-2 ${inputClass}`}>{activeChiefs.map(chief => <option key={chief.id} value={chief.employeeCode}>{chief.employeeCode} · {chief.displayName}</option>)}</select></label><button type="button" disabled={busy || !editChiefCode || editChiefCode === selected.assignedChiefCode} onClick={() => void changePersonnelChief()} className="mt-2 h-10 w-full rounded-xl bg-blue-600 text-[9px] font-black text-white disabled:opacity-40">Şef Atamasını Değiştir</button>{qrDataUrl ? <div className="mt-4 rounded-2xl bg-white p-3"><img src={qrDataUrl} alt={`${selected.employeeCode} QR`} className="mx-auto w-[160px]"/><div className="text-center text-[9px] font-black text-slate-900">{selected.employeeCode}</div></div> : null}<div className="mt-3 flex items-center gap-2 text-[8px] font-black text-emerald-300"><QrCode size={13}/> QR otomatik kaydedildi</div></> : <><div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.06] p-3"><div className="text-[8px] font-black uppercase text-amber-300">4 Haneli PIN</div><div className="mt-2 font-mono text-2xl font-black tracking-[.25em] text-white">{selected.temporaryPin ?? "----"}</div></div><button type="button" disabled={busy} onClick={() => void changeChiefPin()} className="mt-3 h-10 w-full rounded-xl border border-blue-400/20 bg-blue-500/10 text-[9px] font-black text-blue-300 disabled:opacity-40">PIN Sıfırla</button></>}</> : <div className="grid h-full place-items-center text-center text-[9px] text-slate-600">Kayıt seç.</div>}</aside>
    </div>
  </div>;
}
