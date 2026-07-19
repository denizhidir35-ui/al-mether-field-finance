"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, ShieldCheck, Upload, XCircle } from "lucide-react";
import type { PersonnelImportPreview, PersonnelImportResult } from "../domain/personnel-import";
import { HttpHrRepository } from "../repositories/http-hr.repository";

const steps = ["Şablon", "Dosya", "Doğrulama", "Onay", "Sonuç"];

export function PersonnelImportWizard({ onBack, onCompleted }: { onBack: () => void; onCompleted: () => void }) {
  const repository = useMemo(() => new HttpHrRepository(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PersonnelImportPreview | null>(null);
  const [result, setResult] = useState<PersonnelImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function selectFile(next: File | null) {
    setFile(next);
    setPreview(null);
    setResult(null);
    setError("");
  }

  async function validate() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const next = await repository.previewPersonnelImport(file);
      setPreview(next);
      setStep(3);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dosya doğrulanamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!file || !preview || preview.summary.error > 0) return;
    setBusy(true);
    setError("");
    try {
      const next = await repository.commitPersonnelImport(file, preview.importBatchId);
      setResult(next);
      setStep(5);
      onCompleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aktarım tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mether-surface mether-scroll min-h-0 overflow-y-auto rounded-[24px] p-5 sm:p-6">
      <div className="flex flex-col gap-5 border-b border-white/[.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-[9px] font-black text-slate-500 transition hover:text-blue-300"><ArrowLeft size={14} /> Personel listesine dön</button>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">Toplu Personel Aktarımı</div>
          <h2 className="mt-2 text-2xl font-black text-white">Excel ile Personel Aktar</h2>
          <p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-500">Standart şablonu doldurun; tüm satırlar doğrulandıktan ve siz onayladıktan sonra aktarım başlar.</p>
        </div>
        <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[.06] px-4 py-3 text-[9px] leading-5 text-blue-200"><ShieldCheck size={15} className="mb-1" /> Şirket bilgisi güvenli oturumdan alınır.</div>
      </div>

      <ol aria-label="Aktarım adımları" className="mt-5 grid grid-cols-5 gap-1.5">
        {steps.map((label, index) => {
          const number = index + 1;
          const active = number === step;
          const complete = number < step;
          return <li key={label} className={`rounded-xl border px-2 py-2 text-center transition ${active ? "border-blue-400/30 bg-blue-500/[.09] text-blue-200" : complete ? "border-emerald-400/15 bg-emerald-400/[.04] text-emerald-300" : "border-white/[.05] text-slate-600"}`}><div className="text-[8px] font-black">{complete ? "✓" : number}</div><div className="mt-0.5 hidden text-[8px] font-bold sm:block">{label}</div></li>;
        })}
      </ol>

      {error ? <div role="alert" className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[10px] leading-5 text-rose-200">{error}</div> : null}

      {step === 1 ? <WizardCard icon={Download} title="Standart şablonu indirin" description="Kolon adlarını değiştirmeden personel bilgilerini doldurun. Company ID şablonda yer almaz.">
        <a href="/templates/al-mether-personel-import.xlsx" download className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-[10px] font-black text-white transition hover:bg-blue-500 sm:w-auto"><Download size={16} /> Excel Şablonunu İndir</a>
        <button type="button" onClick={() => setStep(2)} className="mt-3 h-11 w-full rounded-2xl border border-white/[.08] px-5 text-[10px] font-black text-slate-300 transition hover:border-blue-400/20 hover:text-white sm:ml-2 sm:w-auto">Dosyam Hazır</button>
      </WizardCard> : null}

      {step === 2 ? <WizardCard icon={Upload} title="Excel dosyanızı yükleyin" description="Yalnız .xlsx dosyaları kabul edilir. En fazla 5 MB ve 1.000 veri satırı yükleyebilirsiniz.">
        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={event => selectFile(event.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-blue-400/20 bg-blue-500/[.025] p-5 text-center transition hover:bg-blue-500/[.05]"><FileSpreadsheet size={26} className="text-blue-300" /><span className="mt-3 text-[11px] font-black text-white">{file?.name ?? "Dosya seçin"}</span><span className="mt-1 text-[9px] text-slate-500">{file ? `${(file.size / 1024).toFixed(1)} KB` : "Bilgisayarınızdan Excel dosyasını seçin"}</span></button>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep(1)} className="h-11 rounded-2xl border border-white/[.08] px-5 text-[10px] font-black text-slate-400">Geri</button><button type="button" disabled={!file || busy} onClick={() => void validate()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-[10px] font-black text-white disabled:opacity-40">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Dosyayı Doğrula</button></div>
      </WizardCard> : null}

      {step === 3 && preview ? <div className="mt-5 space-y-4">
        <SummaryCards preview={preview} />
        <div className="rounded-2xl border border-white/[.06] bg-black/10 p-4 sm:p-5"><h3 className="text-[12px] font-black text-white">Satır doğrulama sonuçları</h3><p className="mt-1 text-[9px] text-slate-500">Hatalı satırlar düzeltilmeden hiçbir kalıcı kayıt oluşturulmaz.</p><div className="mt-4 space-y-2">{preview.rows.map(row => <div key={row.rowNumber} className="rounded-xl border border-white/[.055] bg-black/10 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-black text-white">Satır {row.rowNumber} · {row.values.displayName || "Adsız kayıt"}</div><span className={`text-[8px] font-black uppercase ${row.issues.some(issue => issue.severity === "ERROR") ? "text-rose-300" : row.issues.length ? "text-amber-300" : "text-emerald-300"}`}>{row.issues.some(issue => issue.severity === "ERROR") ? "Hatalı" : row.issues.length ? "Uyarı" : "Hazır"}</span></div>{row.issues.length ? <ul className="mt-2 space-y-1">{row.issues.map((issue, index) => <li key={`${issue.field}-${index}`} className={`text-[9px] leading-4 ${issue.severity === "ERROR" ? "text-rose-200" : "text-amber-200"}`}>{issue.field}: {issue.message}</li>)}</ul> : <div className="mt-2 text-[9px] text-emerald-300">Doğrulama başarılı.</div>}</div>)}</div></div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => { setStep(2); setPreview(null); }} className="h-11 rounded-2xl border border-white/[.08] px-5 text-[10px] font-black text-slate-400">Dosyayı Değiştir</button><button type="button" disabled={preview.summary.error > 0} onClick={() => setStep(4)} className="h-12 rounded-2xl bg-blue-600 px-6 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-35">{preview.summary.error > 0 ? "Hataları Düzeltin" : "Onaya Devam Et"}</button></div>
      </div> : null}

      {step === 4 && preview ? <WizardCard icon={ShieldCheck} title="Aktarımı onaylayın" description="Sunucu dosyanın tamamını yeniden doğrular. Başarılı satırlar korunur; her satır idempotent saga ve kontrollü telafi modeliyle işlenir.">
        <SummaryCards preview={preview} compact />
        <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/[.04] p-4 text-[9px] leading-5 text-amber-100">Bu işlem otomatik aktivasyon SMS'i veya e-postası göndermez. Aktivasyon ayrı ve kontrollü bir adımdır.</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep(3)} disabled={busy} className="h-11 rounded-2xl border border-white/[.08] px-5 text-[10px] font-black text-slate-400">Geri</button><button type="button" onClick={() => void commit()} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-[10px] font-black text-white disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />} {busy ? "Satırlar İşleniyor..." : "Aktarımı Başlat"}</button></div>
      </WizardCard> : null}

      {step === 5 && result ? <WizardCard icon={result.summary.failed ? XCircle : CheckCircle2} title={result.summary.failed ? "Aktarım tamamlandı; inceleme gerekiyor" : "Aktarım tamamlandı"} description={`Batch ${result.importBatchId} · SAGA_COMPENSATION`}>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><ResultMetric label="Toplam" value={result.summary.total} /><ResultMetric label="Başarılı" value={result.summary.success} tone="success" /><ResultMetric label="Başarısız" value={result.summary.failed} tone="danger" /><ResultMetric label="Atlanan" value={result.summary.skipped} /></div>
        <div className="mt-4 space-y-2">{result.rows.map(row => <div key={row.rowNumber} className="flex flex-col gap-2 rounded-xl border border-white/[.055] bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[10px] font-black text-white">Satır {row.rowNumber} · {row.employeeCode ?? "Kod oluşturulmadı"}</div><div className="mt-1 text-[9px] text-slate-500">{row.message}</div></div><span className={`text-[8px] font-black ${row.workflowStatus === "COMPLETED" ? "text-emerald-300" : row.workflowStatus === "MANUAL_REVIEW" ? "text-amber-300" : "text-rose-300"}`}>{row.workflowStatus}</span></div>)}</div>
        <button type="button" onClick={onBack} className="mt-5 h-12 w-full rounded-2xl bg-blue-600 px-6 text-[10px] font-black text-white sm:w-auto">Personel Listesine Dön</button>
      </WizardCard> : null}
    </section>
  );
}

function WizardCard({ icon: Icon, title, description, children }: { icon: typeof Upload; title: string; description: string; children: React.ReactNode }) {
  return <div className="mt-5 rounded-[22px] border border-white/[.06] bg-black/10 p-5 sm:p-6"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/[.09] text-blue-300"><Icon size={20} /></div><h3 className="mt-4 text-lg font-black text-white">{title}</h3><p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-500">{description}</p>{children}</div>;
}

function SummaryCards({ preview, compact = false }: { preview: PersonnelImportPreview; compact?: boolean }) {
  const metrics = [["Toplam", preview.summary.total], ["Hazır", preview.summary.valid], ["Uyarı", preview.summary.warning], ["Hatalı", preview.summary.error]] as const;
  return <div className={`${compact ? "mt-5" : ""} grid grid-cols-2 gap-2 sm:grid-cols-4`}>{metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[.055] bg-black/10 p-4"><div className="text-xl font-black text-white">{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</div></div>)}</div>;
}

function ResultMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" }) {
  return <div className="rounded-2xl border border-white/[.055] bg-black/10 p-4"><div className={`text-xl font-black ${tone === "success" ? "text-emerald-300" : tone === "danger" ? "text-rose-300" : "text-white"}`}>{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</div></div>;
}
