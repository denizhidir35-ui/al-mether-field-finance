import type { ComposeMailInput, MailMessage, MailboxContext } from "./mail";

export interface MailRepository {
  listInbox(context: MailboxContext): Promise<MailMessage[]>;
  send(context: MailboxContext, input: ComposeMailInput): Promise<MailMessage>;
  setRead(context: MailboxContext, messageId: string, isRead: boolean): Promise<void>;
  setStarred(context: MailboxContext, messageId: string, isStarred: boolean): Promise<void>;
  archive(context: MailboxContext, messageId: string): Promise<void>;
  remove(context: MailboxContext, messageId: string): Promise<void>;
  downloadAttachment(context: MailboxContext, attachmentId: string): Promise<Blob>;
}
