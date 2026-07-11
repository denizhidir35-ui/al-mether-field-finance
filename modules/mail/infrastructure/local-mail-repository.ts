import type { ComposeMailInput, MailMessage, MailboxContext } from "../domain/mail";
import type { MailRepository } from "../domain/mail-repository";
import { createSeedMessages } from "./seed";

const STORAGE_PREFIX = "mether-mail:v1";

function storageKey(context: MailboxContext) {
  return `${STORAGE_PREFIX}:${context.companyId}`;
}

function read(context: MailboxContext): MailMessage[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(context));
  if (!raw) {
    const seeded = createSeedMessages(context);
    window.localStorage.setItem(storageKey(context), JSON.stringify(seeded));
    return seeded;
  }
  try {
    return (JSON.parse(raw) as MailMessage[]).filter(message => message.companyId === context.companyId);
  } catch {
    return createSeedMessages(context);
  }
}

function write(context: MailboxContext, messages: MailMessage[]) {
  window.localStorage.setItem(storageKey(context), JSON.stringify(messages));
}

export class LocalMailRepository implements MailRepository {
  async listInbox(context: MailboxContext) {
    return read(context)
      .filter(message => message.recipientEmail === context.userEmail || message.senderEmail === context.userEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async send(context: MailboxContext, input: ComposeMailInput) {
    const message: MailMessage = {
      id: crypto.randomUUID(),
      companyId: context.companyId,
      senderId: context.userId,
      senderName: context.userName,
      senderEmail: context.userEmail,
      recipientId: input.recipientEmail.trim().toLowerCase(),
      recipientName: input.recipientEmail.split("@")[0],
      recipientEmail: input.recipientEmail.trim().toLowerCase(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      hasAttachment: false,
      isRead: true,
      isStarred: false,
      createdAt: new Date().toISOString(),
    };
    write(context, [message, ...read(context)]);
    return message;
  }

  async setRead(context: MailboxContext, messageId: string, isRead: boolean) {
    write(context, read(context).map(message => message.id === messageId && message.recipientEmail === context.userEmail ? { ...message, isRead } : message));
  }

  async setStarred(context: MailboxContext, messageId: string, isStarred: boolean) {
    write(context, read(context).map(message => message.id === messageId && message.recipientEmail === context.userEmail ? { ...message, isStarred } : message));
  }
}
