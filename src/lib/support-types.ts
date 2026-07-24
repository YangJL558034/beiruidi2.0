import type { AdminRole } from "@/lib/content-types";

export type CustomerAccount = {
  id: number;
  email: string;
  name: string;
  status: "active" | "disabled" | "pending_deletion";
  emailVerifiedAt: string;
  privacyConsentAt: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupportStaff = {
  id: number;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  mustChangePassword: boolean;
  presence: "online" | "away" | "offline";
  lastSeenAt: string;
};

export type SupportAttachment = {
  id: number;
  conversationId: number;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  scanStatus: "clean" | "rejected";
  createdAt: string;
  downloadUrl: string;
  isImage: boolean;
};

export type SupportMessage = {
  id: number;
  conversationId: number;
  senderType: "customer" | "staff" | "system";
  senderName: string;
  body: string;
  messageType: "text" | "attachment";
  attachment?: SupportAttachment;
  createdAt: string;
};

export type SupportConversation = {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  subject: string;
  status: "waiting" | "active" | "closed";
  assignedAdminId?: number;
  assignedName?: string;
  customerUnread: number;
  staffUnread: number;
  tags: string[];
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportNote = {
  id: number;
  conversationId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

export type QuickReply = {
  id: number;
  title: string;
  body: string;
  createdBy: number;
  active: boolean;
};
