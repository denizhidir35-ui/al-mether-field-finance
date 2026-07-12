export type MailFilter = "all" | "unread" | "attachments" | "starred";

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
  hasAttachment: boolean;
  isRead: boolean;
  isStarred: boolean;
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
