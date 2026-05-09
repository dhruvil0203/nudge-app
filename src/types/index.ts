/**
 * LinkStash Database Types and Interfaces
 */

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
