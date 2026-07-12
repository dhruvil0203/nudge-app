export interface Link {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
  priority: "important" | "normal" | "someday";
  status: "pending" | "completed";
  reminder_type: string;
  reminder_time: number | null;
  notification_id: string | null;
  created_at: number;
  completed_at: number | null;
  updated_at: number;
}

export interface Settings {
  key: string;
  value: string;
}

export interface ReminderConfig {
  type: string;
  label: string;
  time?: number;
}

export interface AppState {
  pendingLinks: Link[];
  completedLinks: Link[];
  settings: Record<string, string>;
  theme: "light" | "dark";
  isLoading: boolean;
  error: string | null;
}

export type Priority = "important" | "normal" | "someday";
export type LinkStatus = "pending" | "completed";
export type ThemeMode = "light" | "dark";
export type ToastType = "success" | "error" | "warning" | "info";

export interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
}

export interface NotificationPayload {
  linkId?: string;
  url?: string;
  type?: string;
}

export interface ProfileData {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ExportData {
  version: number;
  exportedAt: number;
  links: Link[];
  settings: Record<string, string>;
  profile: ProfileData | null;
}

export interface StorageError {
  code: "PARSE_ERROR" | "CORRUPTED_DATA" | "QUOTA_EXCEEDED" | "UNKNOWN";
  message: string;
  originalError?: unknown;
}
