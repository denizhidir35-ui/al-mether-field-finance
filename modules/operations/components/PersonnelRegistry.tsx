"use client";

import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { Archive, BadgePlus, Pencil, Printer, QrCode, RefreshCw, UserRoundCheck, UserRoundX } from "lucide-react";
import { useOperationsContext } from "../hooks/OperationsProvider";

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/30";

export function PersonnelRegistry() {
  const { readModel, createPersonnel, updatePersonnel, setPersonnelStatus, regeneratePersonnelQr } = useOperationsContext();
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("Saha Personeli");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = readModel.personnelRecords.find(record => record.id === selectedId) ?? readModel.personnelRecords.at(-1);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    setEditName(selected?.displayName ?? "");
    setEditTitle(selected?.title ?? "");
    if (!selected) { setQrDataUrl(""); return; }
    void QRCode.toDataURL(selected.qrValue, { width: 260, margin: 2, color: { dark: "#081225", light: "#f8fafc" } }).then(setQrDataUrl);
  }, [selected]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim()) return;
    createPersonnel({ displayName: displayName.trim(), title: title.trim() || "Saha Personeli" });
    setDisplayName("");
  }

  function savePersonnel() {
    if (!selected || !editName.trim()) return;
    updatePersonnel(selected.id, { displayName: editName, title: editTitle });
  }

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[.72fr_1.28fr]">
      <section className="mether-surface flex min-h-0 flex-col rounded-[24px] p-4">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-blue-400/75"><BadgePlus size={14} /> HR · Personel Yaşam Döngüsü</div>
        <h1 className="mt-2 text-2xl font-black text-white">Personel ve Kalıcı QR</h1>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">Platform kimliği değişmez. Kayıtlar silinmez; aktif, pasif veya arşiv durumunda yönetilir.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Ad Soyad<input aria-label="Personel Ad Soyad" value={displayName} onChange={event => setDisplayName(event.target.value)} className={inputClass} /></label>
          <label className="block text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Görev<input aria-label="Personel Görevi" value={title} onChange={event => setTitle(event.target.value)} className={inputClass} /></label>
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white"><BadgePlus size={17} /> Personel Oluştur</button>
        </form>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4 text-center text-[8px] text-slate-600"><div className="rounded-xl border border-white/[0.05] p-2">Belge altyapısı hazır</div><div className="rounded-xl border border-white/[0.05] p-2">Yetki altyapısı hazır</div></div>
      </section>

      <section className="mether-surface grid min-h-0 gap-3 overflow-hidden rounded-[24px] p-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="mether-scroll min-h-0 overflow-y-auto pr-1">
          <div className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-400/70">Personel Kayıtları · {readModel.personnelRecords.length}</div>
          <div className="mt-3 space-y-2">
            {readModel.personnelRecords.map(record => <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${selected?.id === record.id ? "border-blue-400/25 bg-blue-500/[0.08]" : "border-white/[0.055] bg-black/10"}`}><div><div className="text-[11px] font-black text-white">{record.displayName}</div><div className="mt-1 text-[8px] text-slate-500">{record.title} · {record.status.toLocaleUpperCase("tr-TR")}</div></div><div className="text-[10px] font-black text-blue-300">{record.personnelCode}</div></button>)}
            {readModel.personnelRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-center text-[10px] text-slate-600">Henüz personel oluşturulmadı.</div> : null}
          </div>
        </div>

        <aside className="mether-scroll min-h-0 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          {selected ? <>
            <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-blue-300"><QrCode size={14} /> {selected.personnelCode}</div><span className="text-[7px] text-slate-600">QR v{selected.qrVersion}</span></div>
            {qrDataUrl ? <img src={qrDataUrl} alt={`${selected.personnelCode} personel QR kodu`} className="mx-auto mt-3 w-[150px] rounded-xl bg-white p-2" /> : null}
            <label className="mt-3 block text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">Ad Soyad<input value={editName} onChange={event => setEditName(event.target.value)} className={inputClass} /></label>
            <label className="mt-2 block text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">Görev<input value={editTitle} onChange={event => setEditTitle(event.target.value)} className={inputClass} /></label>
            <button type="button" onClick={savePersonnel} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[9px] font-black text-white"><Pencil size={13} /> Kaydı Güncelle</button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPersonnelStatus(selected.id, selected.status === "active" ? "passive" : "active")} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/[0.07] text-[8px] font-bold text-slate-400">{selected.status === "active" ? <UserRoundX size={12} /> : <UserRoundCheck size={12} />}{selected.status === "active" ? "Pasife Al" : "Aktifleştir"}</button>
              <button type="button" onClick={() => setPersonnelStatus(selected.id, "archived")} disabled={selected.status === "archived"} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/[0.07] text-[8px] font-bold text-slate-400 disabled:opacity-40"><Archive size={12} /> Arşivle</button>
              <button type="button" onClick={() => regeneratePersonnelQr(selected.id)} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/[0.07] text-[8px] font-bold text-slate-400"><RefreshCw size={12} /> QR Yenile</button>
              <button type="button" onClick={() => window.print()} className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/[0.07] text-[8px] font-bold text-slate-400"><Printer size={12} /> Yazdır</button>
            </div>
          </> : <div className="grid h-full place-items-center text-center text-[9px] text-slate-600">QR ve personel işlemleri için kayıt oluştur.</div>}
        </aside>
      </section>
    </div>
  );
}
