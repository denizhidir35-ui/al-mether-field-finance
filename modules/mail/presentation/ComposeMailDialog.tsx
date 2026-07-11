"use client";

import { useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import type { ComposeMailInput } from "../domain/mail";

type Props = { onClose: () => void; onSend: (input: ComposeMailInput) => Promise<void> };

export function ComposeMailDialog({ onClose, onSend }: Props) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    try { await onSend({ recipientEmail, subject, body }); onClose(); }
    finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Yeni mesaj">
      <form onSubmit={submit} className="mether-surface w-full max-w-xl overflow-hidden rounded-[20px] border border-white/10 shadow-2xl">
        <header className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4"><h3 className="text-sm font-bold text-white">Yeni Mesaj</h3><button type="button" onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Kapat"><X size={17} /></button></header>
        <div className="space-y-3 p-4">
          <input required type="email" value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} placeholder="Alıcı e-posta" className="w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50" />
          <input required value={subject} onChange={event => setSubject(event.target.value)} placeholder="Konu" className="w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50" />
          <textarea required value={body} onChange={event => setBody(event.target.value)} placeholder="Mesajınız" rows={7} className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50" />
        </div>
        <footer className="flex justify-end gap-2 border-t border-white/[0.06] p-3"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 hover:bg-white/5">Vazgeç</button><button disabled={sending} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-500 disabled:opacity-50"><Send size={13} />{sending ? "Gönderiliyor" : "Gönder"}</button></footer>
      </form>
    </div>
  );
}
