"use client";

import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { BadgePlus, QrCode, UserRoundPlus } from "lucide-react";
import { useOperationsContext } from "../hooks/OperationsProvider";

export function PersonnelRegistry() {
  const { readModel, createPersonnel } = useOperationsContext();
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("Saha Personeli");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = readModel.personnelRecords.find(record => record.id === selectedId) ?? readModel.personnelRecords.at(-1);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!selected) { setQrDataUrl(""); return; }
    void QRCode.toDataURL(selected.qrValue, { width: 260, margin: 2, color: { dark: "#081225", light: "#f8fafc" } }).then(setQrDataUrl);
  }, [selected]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim()) return;
    createPersonnel({ displayName: displayName.trim(), title: title.trim() || "Saha Personeli" });
    setDisplayName("");
  }

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[.85fr_1.15fr]">
      <section className="mether-surface flex min-h-0 flex-col rounded-[24px] p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-blue-400/75"><UserRoundPlus size={14} /> HR · Personel</div><h1 className="mt-2 text-2xl font-black text-white">Personel ve Kalıcı QR</h1><p className="mt-1 text-[10px] leading-4 text-slate-500">Personel No ve QR bir kez üretilir; tüm saha operasyonlarında aynı kimlik kullanılır.</p>
        <form onSubmit={submit} className="mt-5 space-y-3"><label className="block text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Ad Soyad<input aria-label="Personel Ad Soyad" value={displayName} onChange={event => setDisplayName(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/30" /></label><label className="block text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Görev<input aria-label="Personel Görevi" value={title} onChange={event => setTitle(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/30" /></label><button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white"><BadgePlus size={17} /> Personel Oluştur</button></form>
      </section>
      <section className="mether-surface grid min-h-0 grid-cols-[1fr_auto] gap-3 overflow-hidden rounded-[24px] p-4"><div className="mether-scroll min-h-0 overflow-y-auto"><div className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-400/70">Personel Kayıtları · {readModel.personnelRecords.length}</div><div className="mt-3 space-y-2">{readModel.personnelRecords.map(record => <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${selected?.id === record.id ? "border-blue-400/25 bg-blue-500/[0.08]" : "border-white/[0.055] bg-black/10"}`}><div><div className="text-[11px] font-black text-white">{record.displayName}</div><div className="mt-1 text-[8px] text-slate-500">{record.title}</div></div><div className="text-[10px] font-black text-blue-300">{record.personnelCode}</div></button>)}{readModel.personnelRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-center text-[10px] text-slate-600">Henüz personel oluşturulmadı.</div> : null}</div></div>
        <aside className="flex w-[150px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:w-[210px]"><QrCode size={18} className="text-blue-300" />{selected && qrDataUrl ? <><img src={qrDataUrl} alt={`${selected.personnelCode} personel QR kodu`} className="mt-3 w-full rounded-xl bg-white p-2" /><div className="mt-2 text-[11px] font-black text-white">{selected.personnelCode}</div><div className="mt-1 text-center text-[8px] text-slate-500">Kalıcı AL METHER personel kimliği</div></> : <div className="mt-3 text-center text-[9px] text-slate-600">QR görüntülemek için personel oluşturun.</div>}</aside>
      </section>
    </div>
  );
}
