import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComposeMailInput, MailMessage, MailboxContext } from "../domain/mail";
import type { MailRepository } from "../domain/mail-repository";

type MessageRow = {
  id: string; company_id: string; sender_user_id: string | null; sender_name: string; sender_email: string;
  recipient_user_id: string | null; recipient_name: string; recipient_email: string; subject: string; body: string;
  has_attachment: boolean; is_read: boolean; is_starred: boolean; created_at: string;
};

function fromRow(row: MessageRow): MailMessage {
  return {
    id: row.id, companyId: row.company_id, senderId: row.sender_user_id || row.sender_email, senderName: row.sender_name,
    senderEmail: row.sender_email, recipientId: row.recipient_user_id || row.recipient_email, recipientName: row.recipient_name,
    recipientEmail: row.recipient_email, subject: row.subject, body: row.body, hasAttachment: row.has_attachment,
    isRead: row.is_read, isStarred: row.is_starred, createdAt: row.created_at,
  };
}

export class SupabaseMailRepository implements MailRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async api(path: string, body?: unknown) {
    const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
    if (sessionError || !sessionData.session) throw new Error("Mail işlemi için oturum gerekli.");
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json() as { error?: string; message?: MessageRow };
    if (!response.ok) throw new Error(result.error || "Mail servisi yanıt vermedi.");
    return result;
  }

  async listInbox(context: MailboxContext) {
    await this.api("/api/mail/sync");
    const { data, error } = await this.client.from("mether_mail_messages").select("*")
      .eq("company_id", context.companyId).or(`recipient_user_id.eq.${context.userId},sender_user_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as MessageRow[]).map(fromRow);
  }

  async send(context: MailboxContext, input: ComposeMailInput) {
    const result = await this.api("/api/mail/send", {
      recipientEmail: input.recipientEmail.trim().toLowerCase(),
      subject: input.subject.trim(),
      body: input.body.trim(),
    });
    return fromRow(result.message as MessageRow);
  }

  async setRead(context: MailboxContext, messageId: string, isRead: boolean) {
    const { error } = await this.client.from("mether_mail_messages").update({ is_read: isRead })
      .eq("id", messageId).eq("company_id", context.companyId).eq("recipient_user_id", context.userId);
    if (error) throw error;
  }

  async setStarred(context: MailboxContext, messageId: string, isStarred: boolean) {
    const { error } = await this.client.from("mether_mail_messages").update({ is_starred: isStarred })
      .eq("id", messageId).eq("company_id", context.companyId).eq("recipient_user_id", context.userId);
    if (error) throw error;
  }
}
