"use client";

import { useState, type MouseEvent } from "react";
import { ChevronRight, MailOpen, MoreHorizontal, Paperclip, RefreshCw, Star } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { useMetherMail } from "@/modules/mail/application/useMetherMail";
import type { MailFilter } from "@/modules/mail/domain/mail";
import type { MailMessage } from "@/modules/mail/domain/mail";
import { MailWorkspace } from "@/modules/mail/presentation/MailWorkspace";
import type { WorkspaceOrigin } from "@/components/workspace/WorkspacePanel";

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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"inbox" | "read" | "compose">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [workspaceOrigin, setWorkspaceOrigin] = useState<WorkspaceOrigin | null>(null);

  function openWorkspace(mode: "inbox" | "read" | "compose", message: MailMessage | null, target: HTMLElement) {
    const row = target.closest<HTMLElement>("[data-mail-row]") || target;
    const rect = row.getBoundingClientRect();
    setWorkspaceOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setWorkspaceMode(mode);
    setSelectedMessage(message);
    setWorkspaceOpen(true);
  }

  return (
    <>
      <article className="mether-surface overflow-hidden rounded-[20px]">
        <header className="flex h-12 items-center justify-between gap-3 border-b border-white/[0.06] px-3 sm:px-4">
          <div className="flex items-center gap-3"><div className="flex items-center gap-1.5"><MailOpen size={16} className="text-blue-400" /><h2 className="text-sm font-bold text-white">Gelen Kutusu</h2></div><div className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-bold text-blue-300">{mailbox.unreadCount} yeni</div></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={mailbox.refresh} title="Yenile" className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"><RefreshCw size={14} className={mailbox.loading ? "animate-spin" : ""} /></button>
            <button type="button" title="Diğer" className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"><MoreHorizontal size={15} /></button>
            <button type="button" onClick={event => openWorkspace("compose", null, event.currentTarget)} className="ml-1 h-8 rounded-lg bg-blue-600 px-3 text-[10px] font-bold text-white hover:bg-blue-500">Yeni Mail</button>
          </div>
        </header>
        <div className="flex h-9 items-center gap-3 border-b border-white/[0.05] px-3 text-[10px] font-semibold text-slate-500 sm:px-4">
          {FILTERS.map(item => <button key={item.id} type="button" onClick={() => mailbox.setFilter(item.id)} className={mailbox.filter === item.id ? "text-blue-400" : "transition hover:text-slate-300"}>{item.label}</button>)}
        </div>
        <div className="mether-scroll h-[205px] overflow-auto">
          {mailbox.error ? <div className="grid h-[180px] place-items-center text-[10px] text-rose-300">{mailbox.error}</div> : null}
          {!mailbox.error && !mailbox.loading && mailbox.messages.length === 0 ? <div className="grid h-[180px] place-items-center text-[10px] text-slate-600">Bu filtrede mesaj yok.</div> : null}
          {mailbox.messages.map(mail => {
            const isRecipient = mail.recipientEmail === user.email;
            return (
              <div key={mail.id} data-mail-row className={`group grid w-full grid-cols-[24px_minmax(120px,.48fr)_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.045] px-3 py-2.5 text-left transition-[transform,opacity,background-color,border-color,box-shadow] duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-px hover:border-blue-400/15 hover:bg-blue-500/[0.045] hover:shadow-[0_8px_26px_rgba(37,99,235,.08)] sm:px-4 ${!mail.isRead ? "bg-blue-500/[0.025]" : ""} ${workspaceOpen && selectedMessage?.id !== mail.id ? "opacity-35" : ""} ${workspaceOpen && selectedMessage?.id === mail.id ? "relative z-10 scale-[1.02] border-blue-400/25 bg-blue-500/[0.08] shadow-[0_10px_32px_rgba(37,99,235,.14)]" : ""}`}>
                <button type="button" disabled={!isRecipient} onClick={() => mailbox.toggleStarred(mail)} aria-label="Yıldız" className="disabled:cursor-default"><Star size={13} className={mail.isStarred ? "fill-amber-300 text-amber-300" : "text-slate-600"} /></button>
                <button type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => openWorkspace("read", mail, event.currentTarget)} className="min-w-0 text-left"><div className={`truncate text-[12px] ${!mail.isRead ? "font-black text-slate-100" : "font-semibold text-slate-300"}`}>{mail.senderName}</div><div className="truncate text-[9px] text-slate-500">{mail.senderEmail}</div></button>
                <button type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => openWorkspace("read", mail, event.currentTarget)} className="min-w-0 text-left"><div className={`truncate text-[12px] ${!mail.isRead ? "font-bold text-slate-200" : "font-medium text-slate-400"}`}>{mail.subject}</div><div className="mail-row-preview mt-0.5 text-[10px] text-slate-500">{mail.body}</div></button>
                <div className="flex items-center gap-2">{mail.hasAttachment ? <Paperclip size={12} className="text-slate-600" /> : null}<span className="min-w-[34px] text-right text-[8px] font-semibold text-slate-600">{displayTime(mail.createdAt)}</span></div>
              </div>
            );
          })}
        </div>
        <footer className="flex h-9 items-center justify-between px-3 text-[8px] text-slate-600 sm:px-4"><span>{mailbox.messages.length} / {mailbox.total} mail</span><button type="button" onClick={event => openWorkspace("inbox", null, event.currentTarget)} className="flex items-center gap-1 text-blue-400 transition hover:text-blue-300">Mether Mail<ChevronRight size={12} /></button></footer>
      </article>
      <MailWorkspace open={workspaceOpen} onClose={() => setWorkspaceOpen(false)} user={user} mailbox={mailbox} initialMode={workspaceMode} initialMessage={selectedMessage} origin={workspaceOrigin} />
    </>
  );
}
