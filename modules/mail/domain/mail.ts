export type MailFilter = "all" | "unread" | "attachments" | "starred";

export type MailAttachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
};

export type MailMessage = {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  attachments: MailAttachment[];
  hasAttachment: boolean;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
};

export type ComposeMailInput = {
  recipientEmail: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: { name: string; type: string; data: string }[];
};

export type MailboxContext = {
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
};
