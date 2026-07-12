import type { MailMessage, MailboxContext } from "../domain/mail";

export function createSeedMessages(context: MailboxContext): MailMessage[] {
  const base = Date.now();
  return [
    ["Muhasebe", "muhasebe@almether.com", "Temmuz ayı ödeme planı hazırlandı", "Onaylanması gereken ödeme kalemleri ve belgeler ektedir.", true, true],
    ["Aytaç Türkbay", "aytacturkbay@almether.com", "M085 saha ekibi günlük durum raporu", "Gün sonu çalışmaları, ekip durumu ve kalan işler tamamlandı.", false, true],
    ["Proje Ekibi", "proje@almether.com", "Yeni fiber keşif dosyası", "Saha keşfi, fotoğraflar ve uygulama planı hazırlandı.", true, false],
    ["İnsan Kaynakları", "hr@almether.com", "Yeni personel evrak kontrolü", "Salı günü başlayacak personellerin eksik belgeleri listelendi.", false, false],
  ].map(([name, email, subject, body, attachment, unread], index) => ({
    id: `seed-${index + 1}`,
    companyId: context.companyId,
    senderId: `seed-sender-${index + 1}`,
    senderName: String(name),
    senderEmail: String(email),
    recipientId: context.userId,
    recipientName: context.userName,
    recipientEmail: context.userEmail,
    subject: String(subject),
    body: String(body),
    htmlBody: null,
    attachments: [],
    hasAttachment: Boolean(attachment),
    isRead: !unread,
    isStarred: false,
    isArchived: false,
    createdAt: new Date(base - index * 86_400_000).toISOString(),
  }));
}
