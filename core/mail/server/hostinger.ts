import "server-only";

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MailAccount } from "./account";
import type { ServerMailUser } from "./auth";

function addressName(address?: { name?: string; address?: string }) {
  return address?.name || address?.address?.split("@")[0] || "Bilinmeyen";
}

export async function syncHostingerInbox(adminClient: SupabaseClient, user: ServerMailUser, account: MailAccount) {
  const client = new ImapFlow({
    host: "imap.hostinger.com", port: 993, secure: true,
    auth: { user: account.email, pass: account.password }, logger: false,
  });

  await client.connect();
  try {
    const mailbox = await client.mailboxOpen("INBOX");
    if (!mailbox.exists) return 0;
    const start = Math.max(1, mailbox.exists - 99);
    const rows: Record<string, unknown>[] = [];

    for await (const message of client.fetch(`${start}:*`, { uid: true, source: true, flags: true, internalDate: true })) {
      if (!message.source) continue;
      const parsed = await simpleParser(message.source);
      const sender = parsed.from?.value[0];
      const recipient = parsed.to && !Array.isArray(parsed.to) ? parsed.to.value[0] : Array.isArray(parsed.to) ? parsed.to[0]?.value[0] : undefined;
      const providerId = parsed.messageId || `${account.email}:inbox:${message.uid}`;
      rows.push({
        company_id: user.companyId,
        sender_user_id: null,
        sender_name: addressName(sender),
        sender_email: sender?.address?.toLowerCase() || "unknown@external.invalid",
        recipient_user_id: user.id,
        recipient_name: user.displayName,
        recipient_email: recipient?.address?.toLowerCase() || user.email,
        subject: (parsed.subject || "Konusuz").slice(0, 200),
        body: (parsed.text || parsed.html || "(İçerik yok)").toString().slice(0, 20000),
        has_attachment: parsed.attachments.length > 0,
        is_read: message.flags?.has("\\Seen") ?? false,
        is_starred: message.flags?.has("\\Flagged") ?? false,
        provider_message_id: providerId,
        mailbox_email: account.email,
        direction: "inbound",
        created_at: new Date(parsed.date || message.internalDate || Date.now()).toISOString(),
      });
    }

    if (!rows.length) return 0;
    const { error } = await adminClient.from("mether_mail_messages")
      .upsert(rows, { onConflict: "company_id,mailbox_email,provider_message_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return rows.length;
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function sendHostingerMail(
  adminClient: SupabaseClient,
  user: ServerMailUser,
  account: MailAccount,
  input: { recipientEmail: string; cc: string[]; bcc: string[]; subject: string; body: string; attachments: { name: string; type: string; data: string }[] },
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", port: 465, secure: true,
    auth: { user: account.email, pass: account.password },
  });
  const sent = await transporter.sendMail({
    from: { name: user.displayName, address: account.email },
    to: input.recipientEmail,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    text: input.body,
    attachments: input.attachments.map(attachment => ({
      filename: attachment.name,
      contentType: attachment.type,
      content: Buffer.from(attachment.data.split(",", 2)[1] || "", "base64"),
    })),
  });

  const { data, error } = await adminClient.from("mether_mail_messages").insert({
    company_id: user.companyId,
    sender_user_id: user.id,
    sender_name: user.displayName,
    sender_email: account.email,
    recipient_user_id: null,
    recipient_name: input.recipientEmail.split("@")[0],
    recipient_email: input.recipientEmail,
    subject: input.subject,
    body: input.body,
    has_attachment: input.attachments.length > 0,
    is_read: true,
    is_starred: false,
    provider_message_id: sent.messageId,
    mailbox_email: account.email,
    direction: "outbound",
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}
