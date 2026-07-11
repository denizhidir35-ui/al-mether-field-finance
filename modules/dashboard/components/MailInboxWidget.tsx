"use client";

import { useState } from "react";
import { ChevronRight, MailOpen, MoreHorizontal, Paperclip, RefreshCw, Star } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { useMetherMail } from "@/modules/mail/application/useMetherMail";
import type { MailFilter } from "@/modules/mail/domain/mail";
import { ComposeMailDialog } from "@/modules/mail/presentation/ComposeMailDialog";

const FILTERS: { id: MailFilter; label: string }[] = [
  { id: "all", label: "Tümü" }, { id: "unread", label: "Okunmamış" },
  { id: "attachments", label: "Ekli" }, { id: "starred", label: "Yıldızlı" },
];

function displayTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(date);
}

export function MailInboxWidget({ user }: { user: AppUser }) {
  const mailbox = useMetherMail(user);
  const [composing, setComposing] = useState(false);

  return (
    <>
      <article className="mether-surface overflow-hidden rounded-[20px]">
        <header className="flex h-12 items-center justify-between gap-3 border-b border-white/[0.06] px-3 sm:px-4">
          <div className="flex items-center gap-3"><div className="flex items-center gap-1.5"><MailOpen size={16} className="text-blue-400" /><h2 className="text-sm font-bold text-white">Gelen Kutusu</h2></div><div className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-bold text-blue-300">{mailbox.unreadCount} yeni</div></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={mailbox.refresh} title="Yenile" className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"><RefreshCw size={14} className={mailbox.loading ? "animate-spin" : ""} /></button>
            <button type="button" title="Diğer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"><MoreHorizontal size={15} /></button>
            <button type="button" onClick={() => setComposing(true)} className="ml-1 h-8 rounded-lg bg-blue-600 px-3 text-[10px] font-bold text-white hover:bg-blue-500">Yeni Mail</button>
          </div>
        </header>
        <div className="flex h-9 items-center gap-2 border-b border-white/[0.05] px-3 text-[9px] font-semibold text-slate-500 sm:px-4">
          {FILTERS.map(item => <button key={item.id} type="button" onClick={() => mailbox.setFilter(item.id)} className={mailbox.filter === item.id ? "text-blue-400" : "transition hover:text-slate-300"}>{item.label}</button>)}
        </div>
        <div className="mether-scroll max-h-[310px] min-h-[180px] overflow-auto">
          {mailbox.error ? <div className="grid h-[180px] place-items-center text-[10px] text-rose-300">{mailbox.error}</div> : null}
          {!mailbox.error && !mailbox.loading && mailbox.messages.length === 0 ? <div className="grid h-[180px] place-items-center text-[10px] text-slate-600">Bu filtrede mesaj yok.</div> : null}
          {mailbox.messages.map(mail => {
            const isRecipient = mail.recipientEmail === user.email;
            return (
              <div key={mail.id} className={`grid w-full grid-cols-[24px_minmax(120px,.48fr)_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.045] px-3 py-2.5 text-left transition hover:bg-white/[0.025] sm:px-4 ${!mail.isRead ? "bg-blue-500/[0.025]" : ""}`}>
                <button type="button" disabled={!isRecipient} onClick={() => mailbox.toggleStarred(mail)} aria-label="Yıldız" className="disabled:cursor-default"><Star size={13} className={mail.isStarred ? "fill-amber-300 text-amber-300" : "text-slate-600"} /></button>
                <button type="button" onClick={() => mailbox.toggleRead(mail)} className="min-w-0 text-left"><div className={`truncate text-[11px] ${!mail.isRead ? "font-black text-slate-100" : "font-semibold text-slate-300"}`}>{mail.senderName}</div><div className="truncate text-[8px] text-slate-600">{mail.senderEmail}</div></button>
                <button type="button" onClick={() => mailbox.toggleRead(mail)} className="min-w-0 text-left"><div className={`truncate text-[11px] ${!mail.isRead ? "font-bold text-slate-200" : "font-medium text-slate-400"}`}>{mail.subject}</div><div className="mt-0.5 truncate text-[9px] text-slate-600">{mail.body}</div></button>
                <div className="flex items-center gap-2">{mail.hasAttachment ? <Paperclip size={12} className="text-slate-600" /> : null}<span className="min-w-[34px] text-right text-[8px] font-semibold text-slate-600">{displayTime(mail.createdAt)}</span></div>
              </div>
            );
          })}
        </div>
        <footer className="flex h-9 items-center justify-between px-3 text-[8px] text-slate-600 sm:px-4"><span>{mailbox.messages.length} / {mailbox.total} mail</span><span className="flex items-center gap-1 text-blue-400">Mether Mail<ChevronRight size={12} /></span></footer>
      </article>
      {composing ? <ComposeMailDialog onClose={() => setComposing(false)} onSend={mailbox.send} /> : null}
    </>
  );
}
