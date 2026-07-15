import { ArrowLeft, CheckCircle2, ScanLine } from "lucide-react";

type FileCapture = { accept: string; capture?: "environment"; onFile: (file: File) => void | Promise<void> };

export function ChiefActionCard({ title, eyebrow, description, actionLabel, complete, disabled, error, fileCapture, onAction, onBack }: { title: string; eyebrow: string; description: string; actionLabel: string; complete?: boolean; disabled?: boolean; error?: string | null; fileCapture?: FileCapture; onAction?: () => void | Promise<void>; onBack: () => void }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-4">
      <button type="button" onClick={onBack} className="flex h-9 w-fit items-center gap-1.5 text-[9px] font-bold text-slate-500"><ArrowLeft size={13} /> Ana Konsol</button>
      <div className="mt-auto text-[9px] font-black uppercase tracking-[0.18em] text-blue-400/70">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{title}</h2>
      <p className="mt-3 max-w-sm text-[11px] leading-5 text-slate-500">{description}</p>
      {error ? <div role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-[10px] text-rose-200">{error}</div> : null}
      <div className="mt-auto pt-6">
        {fileCapture ? <label aria-disabled={complete || disabled} className={`flex h-16 w-full items-center justify-center gap-2 rounded-[20px] px-4 text-[12px] font-black transition ${complete || disabled ? "bg-white/[0.05] text-slate-500" : "cursor-pointer bg-blue-600 text-white shadow-[0_18px_45px_rgba(37,99,235,.28)] active:scale-[.985]"}`}><ScanLine size={18} />{complete ? "Operasyon Tamamlandı" : actionLabel}<input type="file" accept={fileCapture.accept} capture={fileCapture.capture} disabled={complete || disabled} className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) void fileCapture.onFile(file); event.target.value = ""; }} /></label> : <button type="button" disabled={complete || disabled} onClick={onAction} className="flex h-16 w-full items-center justify-center gap-2 rounded-[20px] bg-blue-600 px-4 text-[12px] font-black text-white shadow-[0_18px_45px_rgba(37,99,235,.28)] transition active:scale-[.985] disabled:bg-white/[0.05] disabled:text-slate-500 disabled:shadow-none"><CheckCircle2 size={18} />{complete ? "Operasyon Tamamlandı" : actionLabel}</button>}
      </div>
    </section>
  );
}
