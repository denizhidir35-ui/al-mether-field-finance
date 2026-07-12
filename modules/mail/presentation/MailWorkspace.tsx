"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Archive, ArrowLeft, Download, Eye, Forward, MailOpen, Paperclip, RefreshCw, Reply, ReplyAll, Send, Star, Trash2, X } from "lucide-react";
import { FocusLayer } from "@/components/workspace/FocusLayer";
import type { WorkspaceOrigin } from "@/components/workspace/WorkspacePanel";
import type { AppUser } from "@/types/auth";
import type { useMetherMail } from "../application/useMetherMail";
import type { ComposeMailInput, MailMessage } from "../domain/mail";

type Mailbox = ReturnType<typeof useMetherMail>;
type WorkspaceMode = "inbox" | "read" | "compose";
type Draft = { recipientEmail: string; cc: string; bcc: string; subject: string; body: string };

const EMPTY_DRAFT: Draft = { recipientEmail: "", cc: "", bcc: "", subject: "", body: "" };

type MailWorkspaceProps = {
  open: boolean;
  onClose: () => void;
  user: AppUser;
  mailbox: Mailbox;
  initialMode: WorkspaceMode;
  initialMessage: MailMessage | null;
  origin: WorkspaceOrigin | null;
};

function splitEmails(value: string) {
  return value.split(/[;,]/).map(item => item.trim().toLowerCase()).filter(Boolean);
}

function fileToAttachment(file: File) {
  return new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", data: String(reader.result) });
    reader.onerror = () => reject(new Error(`${file.name} okunamadı.`));
    reader.readAsDataURL(file);
  });
}

function messageDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MailWorkspace({ open, onClose, user, mailbox, initialMode, initialMessage, origin }: MailWorkspaceProps) {
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  const [selected, setSelected] = useState<MailMessage | null>(initialMessage);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const draftLoaded = useRef(false);
  const draftKey = `mether-mail:draft:${user.id}`;

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setSelected(initialMessage);
  }, [initialMessage, initialMode, open]);

  useEffect(() => {
    if (!open || mode !== "compose" || draftLoaded.current) return;
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      try { setDraft(JSON.parse(saved) as Draft); } catch { window.localStorage.removeItem(draftKey); }
    }
    draftLoaded.current = true;
  }, [draftKey, mode, open]);

  useEffect(() => {
    if (!draftLoaded.current) return;
    const hasContent = Object.values(draft).some(value => value.trim());
    if (hasContent) window.localStorage.setItem(draftKey, JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey);
  }, [draft, draftKey]);

  useEffect(() => () => {
    if (attachmentPreview?.url) URL.revokeObjectURL(attachmentPreview.url);
  }, [attachmentPreview]);

  const visibleMessages = useMemo(() => mailbox.messages, [mailbox.messages]);

  function openMessage(message: MailMessage) {
    setSelected(message);
    setMode("read");
    if (!message.isRead && message.recipientEmail === user.email) void mailbox.toggleRead(message);
  }

  function beginReply(message: MailMessage, all = false) {
    setDraft({
      recipientEmail: message.senderEmail,
      cc: all && message.recipientEmail !== user.email ? message.recipientEmail : "",
      bcc: "",
      subject: message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`,
      body: `\n\n--- ${message.senderName} yazdı ---\n${message.body}`,
    });
    draftLoaded.current = true;
    setMode("compose");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setSendError(null);
    try {
      const attachments = await Promise.all(files.map(fileToAttachment));
      const input: ComposeMailInput = {
        recipientEmail: draft.recipientEmail,
        cc: splitEmails(draft.cc),
        bcc: splitEmails(draft.bcc),
        subject: draft.subject,
        body: draft.body,
        attachments,
      };
      await mailbox.send(input);
      window.localStorage.removeItem(draftKey);
      setDraft(EMPTY_DRAFT);
      setFiles([]);
      draftLoaded.current = false;
      setMode("inbox");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Mail gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  async function downloadAttachment(id: string, name: string) {
    const blob = await mailbox.downloadAttachment(id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function openAttachment(id: string, name: string, type: string) {
    const blob = await mailbox.downloadAttachment(id);
    const url = URL.createObjectURL(blob);
    setAttachmentPreview({ url, name, type });
  }

  async function archiveSelected() {
    if (!selected) return;
    await mailbox.archive(selected);
    setSelected(null);
    setMode("inbox");
  }

  async function removeSelected() {
    if (!selected) return;
    await mailbox.remove(selected);
    setSelected(null);
    setMode("inbox");
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (total > 8 * 1024 * 1024) { setSendError("Eklerin toplam boyutu 8 MB sınırını aşamaz."); return; }
    setFiles(selectedFiles);
  }

  return (
    <FocusLayer
      open={open}
      onClose={onClose}
      label="Mether Mail çalışma alanı"
      origin={origin}
      originPreview={initialMessage ? (
        <div className="flex h-full items-center gap-3 px-4"><div className="min-w-0"><div className="truncate text-[12px] font-black text-white">{initialMessage.senderName}</div><div className="mt-1 truncate text-[10px] text-slate-400">{initialMessage.subject}</div></div></div>
      ) : (
        <div className="grid h-full place-items-center text-[10px] font-bold text-blue-200">Mether Mail</div>
      )}
    >
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/[0.07] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {mode !== "inbox" ? <button type="button" onClick={() => setMode("inbox")} className="workspace-icon-button md:hidden" aria-label="Gelen kutusuna dön"><ArrowLeft size={17} /></button> : null}
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/12 text-blue-300"><MailOpen size={18} /></div>
          <div className="min-w-0"><h2 className="truncate text-sm font-black text-white">Mether Mail</h2><p className="truncate text-[10px] text-slate-500">{user.email} · Focus Workspace</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={mailbox.refresh} className="workspace-icon-button" aria-label="Mailleri yenile"><RefreshCw size={16} className={mailbox.loading ? "animate-spin" : ""} /></button>
          <button type="button" onClick={() => { setMode("compose"); setSendError(null); }} className="rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-blue-500">Yeni Mail</button>
          <button type="button" onClick={onClose} className="workspace-icon-button" aria-label="Çalışma alanını kapat"><X size={17} /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={`w-full shrink-0 border-r border-white/[0.06] md:w-[340px] ${mode !== "inbox" ? "max-md:hidden" : ""}`}>
          <div className="flex h-12 items-center justify-between border-b border-white/[0.05] px-4"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Gelen Kutusu</span><span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-300">{mailbox.unreadCount} yeni</span></div>
          <div className="mether-scroll h-[calc(100%-48px)] overflow-y-auto">
            {visibleMessages.map(message => (
              <button key={message.id} type="button" onClick={() => openMessage(message)} className={`block w-full border-b border-white/[0.045] px-4 py-3.5 text-left transition hover:bg-white/[0.035] ${selected?.id === message.id ? "bg-blue-500/[0.08]" : ""}`}>
                <div className="flex items-center justify-between gap-3"><span className={`truncate text-[12px] ${message.isRead ? "font-semibold text-slate-300" : "font-black text-white"}`}>{message.senderName}</span><span className="shrink-0 text-[8px] text-slate-600">{messageDate(message.createdAt)}</span></div>
                <div className={`mt-1 truncate text-[11px] ${message.isRead ? "text-slate-500" : "font-bold text-slate-300"}`}>{message.subject}</div>
                <div className="mt-1 truncate text-[10px] text-slate-600">{message.body}</div>
              </button>
            ))}
            {!mailbox.loading && !visibleMessages.length ? <div className="grid h-56 place-items-center text-[11px] text-slate-600">Bu görünümde mail yok.</div> : null}
          </div>
        </aside>

        <main className={`min-w-0 flex-1 ${mode === "inbox" ? "max-md:hidden" : ""}`}>
          {mode === "read" && selected ? (
            <div className="flex h-full flex-col">
              <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/[0.05] px-4 sm:px-6">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => beginReply(selected)} className="workspace-icon-button" title="Yanıtla"><Reply size={16} /></button>
                  <button type="button" onClick={() => beginReply(selected, true)} className="workspace-icon-button" title="Tümüne yanıtla"><ReplyAll size={16} /></button>
                  <button type="button" onClick={() => { setDraft({ ...EMPTY_DRAFT, subject: `Fwd: ${selected.subject}`, body: selected.body }); draftLoaded.current = true; setMode("compose"); }} className="workspace-icon-button" title="İlet"><Forward size={16} /></button>
                </div>
                <div className="flex items-center gap-1"><button type="button" onClick={() => void archiveSelected()} className="workspace-icon-button" title="Arşiv"><Archive size={16} /></button><button type="button" onClick={() => void removeSelected()} className="workspace-icon-button text-rose-300/70" title="Sil"><Trash2 size={16} /></button></div>
              </div>
              <article className="mether-scroll flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                <h1 className="text-xl font-black tracking-[-0.02em] text-white sm:text-2xl">{selected.subject}</h1>
                <div className="mt-5 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-5"><div><div className="text-sm font-bold text-slate-200">{selected.senderName}</div><div className="mt-1 text-[10px] text-slate-500">{selected.senderEmail} → {selected.recipientEmail}</div></div><div className="text-right text-[9px] text-slate-600">{messageDate(selected.createdAt)}{selected.hasAttachment ? <div className="mt-2 flex items-center justify-end gap-1"><Paperclip size={12} /> Ekli</div> : null}</div></div>
                {selected.attachments.length ? <div className="flex flex-wrap gap-2 border-b border-white/[0.06] py-4">{selected.attachments.map(attachment => <div key={attachment.id} className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"><button type="button" onClick={() => void openAttachment(attachment.id, attachment.name, attachment.contentType)} className="flex items-center gap-2 px-3 py-2 text-left"><Eye size={13} className="text-blue-300" /><span><span className="block max-w-[220px] truncate text-[10px] font-bold text-slate-200">{attachment.name}</span><span className="text-[8px] text-slate-600">{Math.max(1, Math.round(attachment.size / 1024))} KB</span></span></button><button type="button" onClick={() => void downloadAttachment(attachment.id, attachment.name)} title="İndir" className="grid h-10 w-9 place-items-center border-l border-white/[0.07] text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"><Download size={13} /></button></div>)}</div> : null}
                {selected.htmlBody ? (
                  <iframe title={`${selected.subject} içeriği`} sandbox="allow-popups" srcDoc={selected.htmlBody} className="mt-6 min-h-[620px] w-full rounded-xl border border-white/[0.08] bg-white" />
                ) : (
                  <div className="whitespace-pre-wrap break-words py-7 text-[13px] leading-7 text-slate-300">{selected.body}</div>
                )}
              </article>
              {attachmentPreview ? <div className="absolute inset-0 z-30 flex flex-col bg-[#07101f]/98"><header className="flex h-14 items-center justify-between gap-3 border-b border-white/[0.08] px-4"><div className="min-w-0"><div className="truncate text-[11px] font-bold text-white">{attachmentPreview.name}</div><div className="text-[8px] text-slate-600">{attachmentPreview.type}</div></div><div className="flex items-center gap-1"><button type="button" onClick={() => { const link = document.createElement("a"); link.href = attachmentPreview.url; link.download = attachmentPreview.name; link.click(); }} className="workspace-icon-button" title="İndir"><Download size={16} /></button><button type="button" onClick={() => setAttachmentPreview(null)} className="workspace-icon-button" aria-label="Ek önizlemeyi kapat"><X size={17} /></button></div></header><div className="min-h-0 flex-1 bg-slate-950/60 p-3">{attachmentPreview.type === "application/pdf" || attachmentPreview.type.startsWith("image/") ? <iframe title={`${attachmentPreview.name} önizleme`} src={attachmentPreview.url} className="h-full w-full rounded-xl border border-white/[0.08] bg-white" /> : <div className="grid h-full place-items-center text-center"><div><Paperclip size={30} className="mx-auto text-blue-300/60" /><p className="mt-3 text-xs font-bold text-slate-300">Bu dosya tarayıcıda önizlenemiyor.</p><p className="mt-1 text-[10px] text-slate-600">İndirme butonuyla güvenli şekilde açabilirsin.</p></div></div>}</div></div> : null}
            </div>
          ) : null}

          {mode === "compose" ? (
            <form onSubmit={submit} className="flex h-full flex-col">
              <div className="border-b border-white/[0.05] px-4 py-3 sm:px-6"><h3 className="text-sm font-black text-white">Yeni Mail</h3><p className="mt-1 text-[9px] text-slate-600">Taslak otomatik kaydedilir</p></div>
              <div className="mether-scroll flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                <input required type="email" value={draft.recipientEmail} onChange={event => setDraft(current => ({ ...current, recipientEmail: event.target.value }))} placeholder="Kime" className="workspace-input" />
                <div className="grid gap-3 sm:grid-cols-2"><input value={draft.cc} onChange={event => setDraft(current => ({ ...current, cc: event.target.value }))} placeholder="CC" className="workspace-input" /><input value={draft.bcc} onChange={event => setDraft(current => ({ ...current, bcc: event.target.value }))} placeholder="BCC" className="workspace-input" /></div>
                <input required value={draft.subject} onChange={event => setDraft(current => ({ ...current, subject: event.target.value }))} placeholder="Konu" className="workspace-input" />
                <textarea required value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} placeholder="Mesajınızı yazın..." className="workspace-input min-h-[260px] resize-none leading-6" />
                {files.length ? <div className="flex flex-wrap gap-2">{files.map(file => <span key={`${file.name}-${file.size}`} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[9px] text-slate-400"><Paperclip size={11} />{file.name}</span>)}</div> : null}
                {sendError ? <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">{sendError}</p> : null}
              </div>
              <footer className="flex items-center justify-between border-t border-white/[0.06] p-3 sm:px-6"><label className="workspace-icon-button cursor-pointer" title="Ek ekle"><Paperclip size={16} /><input type="file" multiple onChange={onFiles} className="sr-only" /></label><button disabled={sending} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[11px] font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"><Send size={15} />{sending ? "Gönderiliyor" : "Gönder"}</button></footer>
            </form>
          ) : null}

          {mode === "inbox" ? <div className="grid h-full place-items-center text-center"><div><MailOpen size={30} className="mx-auto text-blue-400/50" /><p className="mt-3 text-xs font-semibold text-slate-400">Odak alanına hoş geldin</p><p className="mt-1 text-[10px] text-slate-600">Okumak için bir mail seç.</p></div></div> : null}
        </main>
      </div>
    </FocusLayer>
  );
}
