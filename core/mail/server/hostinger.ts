import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import type { MailAccount } from "./account";
import type { ServerMailUser } from "./auth";

function addressName(address?: { name?: string; address?: string }) {
  return address?.name || address?.address?.split("@")[0] || "Bilinmeyen";
}

function safeHtmlBody(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "html", "head", "body", "table", "tbody", "thead", "tfoot", "tr", "td", "th", "img", "center"],
    allowedAttributes: {
      "*": ["class", "id", "style", "dir", "title", "width", "height", "align", "valign", "cellpadding", "cellspacing", "border"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "data", "cid"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) },
  });
}

function mailBodies(text?: string, html?: string | false) {
  const textLooksLikeHtml = Boolean(text && /<(html|table|body|div|img)[\s>]/i.test(text));
  const htmlCandidate = typeof html === "string" ? html : textLooksLikeHtml ? text || "" : "";
  const plain = text && !textLooksLikeHtml
    ? text
    : htmlCandidate
      ? sanitizeHtml(htmlCandidate, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim()
      : "(İçerik yok)";
  return { plain: plain.slice(0, 20000), html: htmlCandidate ? safeHtmlBody(htmlCandidate) : null };
}

async function persistAttachments(
  adminClient: SupabaseClient,
  user: ServerMailUser,
  messageId: string,
  providerId: string,
  attachments: { filename?: string; contentType?: string; content: Buffer; size?: number }[],
) {
  const providerHash = createHash("sha256").update(providerId).digest("hex").slice(0, 24);
  for (const [index, attachment] of attachments.entries()) {
    const filename = (attachment.filename || `ek-${index + 1}`).replace(/[\\/:*?"<>|]/g, "_").slice(0, 180);
    const path = `${user.companyId}/${user.id}/${providerHash}/${index}-${filename}`;
    const upload = await adminClient.storage.from("mail-attachments").upload(path, attachment.content, {
      contentType: attachment.contentType || "application/octet-stream", upsert: true,
    });
    if (upload.error) throw new Error(upload.error.message);
    const metadata = await adminClient.from("mether_mail_attachments").upsert({
      company_id: user.companyId,
      message_id: messageId,
      filename,
      content_type: attachment.contentType || "application/octet-stream",
      byte_size: attachment.size || attachment.content.length,
      storage_path: path,
    }, { onConflict: "message_id,filename,byte_size" });
    if (metadata.error) throw new Error(metadata.error.message);
  }
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
    let processed = 0;

    for await (const message of client.fetch(`${start}:*`, { uid: true, source: true, flags: true, internalDate: true })) {
      if (!message.source) continue;
      const parsed = await simpleParser(message.source);
      const sender = parsed.from?.value[0];
      const recipient = parsed.to && !Array.isArray(parsed.to) ? parsed.to.value[0] : Array.isArray(parsed.to) ? parsed.to[0]?.value[0] : undefined;
      const providerId = parsed.messageId || `${account.email}:inbox:${message.uid}`;
      const bodies = mailBodies(parsed.text, parsed.html);
      const { data: existing } = await adminClient.from("mether_mail_messages")
        .select("is_read,is_starred,is_archived,deleted_at")
        .eq("company_id", user.companyId).eq("mailbox_email", account.email).eq("provider_message_id", providerId).maybeSingle();

      const upsert = await adminClient.from("mether_mail_messages").upsert({
        company_id: user.companyId,
        sender_user_id: null,
        sender_name: addressName(sender),
        sender_email: sender?.address?.toLowerCase() || "unknown@external.invalid",
        recipient_user_id: user.id,
        recipient_name: user.displayName,
        recipient_email: recipient?.address?.toLowerCase() || user.email,
        subject: (parsed.subject || "Konusuz").slice(0, 200),
        body: bodies.plain,
        html_body: bodies.html,
        has_attachment: parsed.attachments.length > 0,
        is_read: existing?.is_read ?? message.flags?.has("\\Seen") ?? false,
        is_starred: existing?.is_starred ?? message.flags?.has("\\Flagged") ?? false,
        is_archived: existing?.is_archived ?? false,
        deleted_at: existing?.deleted_at ?? null,
        provider_message_id: providerId,
        mailbox_email: account.email,
        direction: "inbound",
        created_at: new Date(parsed.date || message.internalDate || Date.now()).toISOString(),
      }, { onConflict: "company_id,mailbox_email,provider_message_id" }).select("id").single();
      if (upsert.error) throw new Error(upsert.error.message);

      await persistAttachments(adminClient, user, upsert.data.id, providerId, parsed.attachments.map(attachment => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        content: attachment.content,
        size: attachment.size,
      })));
      processed += 1;
    }
    return processed;
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
  const outgoingAttachments = input.attachments.map(attachment => ({
    filename: attachment.name,
    contentType: attachment.type,
    content: Buffer.from(attachment.data.split(",", 2)[1] || "", "base64"),
  }));
  const sent = await transporter.sendMail({
    from: { name: user.displayName, address: account.email },
    to: input.recipientEmail, cc: input.cc, bcc: input.bcc,
    subject: input.subject, text: input.body, attachments: outgoingAttachments,
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
    html_body: null,
    has_attachment: input.attachments.length > 0,
    is_read: true,
    is_starred: false,
    provider_message_id: sent.messageId,
    mailbox_email: account.email,
    direction: "outbound",
  }).select("*").single();
  if (error) throw new Error(error.message);
  await persistAttachments(adminClient, user, data.id, sent.messageId, outgoingAttachments);
  return data;
}
