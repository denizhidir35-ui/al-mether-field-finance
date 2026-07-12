"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppUser } from "@/types/auth";
import type { ComposeMailInput, MailFilter, MailMessage, MailboxContext } from "../domain/mail";
import type { MailRepository } from "../domain/mail-repository";
import { createMailRepository } from "../infrastructure/mail-repository-factory";

export function useMetherMail(user: AppUser) {
  const [repository, setRepository] = useState<MailRepository | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [filter, setFilter] = useState<MailFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const context = useMemo<MailboxContext>(() => ({
    companyId: user.companyId, userId: user.id, userName: user.name, userEmail: user.email,
  }), [user.companyId, user.email, user.id, user.name]);

  const load = useCallback(async (repo?: MailRepository) => {
    const active = repo ?? repository;
    if (!active) return;
    setLoading(true);
    try { setMessages(await active.listInbox(context)); setError(null); }
    catch { setError("Mailler yüklenemedi."); }
    finally { setLoading(false); }
  }, [context, repository]);

  useEffect(() => {
    let active = true;
    void createMailRepository().then(repo => {
      if (!active) return;
      setRepository(repo);
      setLoading(true);
      return repo.listInbox(context).then(items => {
        if (active) { setMessages(items); setError(null); }
      }).catch(() => {
        if (active) setError("Mailler yüklenemedi.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    });
    return () => { active = false; };
  }, [context]);

  const send = useCallback(async (input: ComposeMailInput) => {
    if (!repository) throw new Error("Mail servisi hazır değil.");
    try {
      await repository.send(context, input);
      await load(repository);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Mail gönderilemedi.";
      setError(message);
      throw sendError;
    }
  }, [context, load, repository]);

  const toggleRead = useCallback(async (message: MailMessage) => {
    if (!repository || message.recipientEmail !== context.userEmail) return;
    setMessages(current => current.map(item => item.id === message.id ? { ...item, isRead: !item.isRead } : item));
    try { await repository.setRead(context, message.id, !message.isRead); }
    catch { await load(repository); }
  }, [context, load, repository]);

  const toggleStarred = useCallback(async (message: MailMessage) => {
    if (!repository || message.recipientEmail !== context.userEmail) return;
    setMessages(current => current.map(item => item.id === message.id ? { ...item, isStarred: !item.isStarred } : item));
    try { await repository.setStarred(context, message.id, !message.isStarred); }
    catch { await load(repository); }
  }, [context, load, repository]);

  const archive = useCallback(async (message: MailMessage) => {
    if (!repository) return;
    await repository.archive(context, message.id);
    setMessages(current => current.filter(item => item.id !== message.id));
  }, [context, repository]);

  const remove = useCallback(async (message: MailMessage) => {
    if (!repository) return;
    await repository.remove(context, message.id);
    setMessages(current => current.filter(item => item.id !== message.id));
  }, [context, repository]);

  const downloadAttachment = useCallback(async (attachmentId: string) => {
    if (!repository) throw new Error("Mail servisi hazır değil.");
    return repository.downloadAttachment(context, attachmentId);
  }, [context, repository]);

  const filteredMessages = messages.filter(message => {
    if (filter === "unread") return !message.isRead;
    if (filter === "attachments") return message.hasAttachment;
    if (filter === "starred") return message.isStarred;
    return true;
  });

  return { messages: filteredMessages, total: messages.length, unreadCount: messages.filter(item => !item.isRead).length,
    filter, setFilter, loading, error, refresh: () => load(), send, toggleRead, toggleStarred,
    archive, remove, downloadAttachment };
}
