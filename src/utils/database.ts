import AsyncStorage from "@react-native-async-storage/async-storage";

const LINKS_KEY = "@nudge/links";
const SETTINGS_KEY = "@nudge/settings";
let nextId = 1;

export const initDatabase = async () => {
  try {
    const linksJson = await AsyncStorage.getItem(LINKS_KEY);
    const links: Link[] = linksJson ? JSON.parse(linksJson) : [];
    if (links.length > 0) {
      nextId = Math.max(...links.map((l) => l.id)) + 1;
    }

    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!settingsJson) {
      const defaults: Record<string, string> = {
        default_reminder: "no_reminder",
        weekly_digest_enabled: "1",
        theme_mode: "light",
        last_digest_timestamp: "0",
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    }
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

export interface Link {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string | null;
  priority: string;
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

export const getAllLinks = async (): Promise<Link[]> => {
  const json = await AsyncStorage.getItem(LINKS_KEY);
  return json ? JSON.parse(json) : [];
};

const saveAllLinks = async (links: Link[]): Promise<void> => {
  await AsyncStorage.setItem(LINKS_KEY, JSON.stringify(links));
};

export const addLink = async (
  url: string,
  title: string | null = null,
  description: string | null = null,
  image: string | null = null,
  domain: string | null = null,
  priority: string = "normal",
): Promise<Link> => {
  const now = Date.now();
  const link: Link = {
    id: nextId++,
    url,
    title,
    description,
    image,
    domain,
    priority,
    status: "pending",
    reminder_type: "no_reminder",
    reminder_time: null,
    notification_id: null,
    created_at: now,
    completed_at: null,
    updated_at: now,
  };

  const links = await getAllLinks();
  links.push(link);
  await saveAllLinks(links);
  return link;
};

export const updateLinkReminder = async (
  linkId: number,
  reminderType: string,
  reminderTime: number | null = null,
  notificationId: string | null = null,
): Promise<void> => {
  const links = await getAllLinks();
  const idx = links.findIndex((l) => l.id === linkId);
  if (idx === -1) return;
  links[idx] = {
    ...links[idx],
    reminder_type: reminderType,
    reminder_time: reminderTime,
    notification_id: notificationId,
    updated_at: Date.now(),
  };
  await saveAllLinks(links);
};

export const markLinkComplete = async (linkId: number): Promise<void> => {
  const links = await getAllLinks();
  const idx = links.findIndex((l) => l.id === linkId);
  if (idx === -1) return;
  links[idx] = {
    ...links[idx],
    status: "completed",
    completed_at: Date.now(),
    updated_at: Date.now(),
  };
  await saveAllLinks(links);
};

export const updateLinkPriority = async (
  linkId: number,
  priority: string,
): Promise<void> => {
  const links = await getAllLinks();
  const idx = links.findIndex((l) => l.id === linkId);
  if (idx === -1) return;
  links[idx] = {
    ...links[idx],
    priority,
    updated_at: Date.now(),
  };
  await saveAllLinks(links);
};

export const getPendingLinks = async (): Promise<Link[]> => {
  const links = await getAllLinks();
  return links
    .filter((l) => l.status === "pending")
    .sort((a, b) => b.created_at - a.created_at);
};

export const getCompletedLinks = async (): Promise<Link[]> => {
  const links = await getAllLinks();
  return links
    .filter((l) => l.status === "completed")
    .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0));
};

export const getLinkById = async (id: number): Promise<Link | null> => {
  const links = await getAllLinks();
  return links.find((l) => l.id === id) || null;
};

export const deleteLink = async (id: number): Promise<void> => {
  const links = await getAllLinks();
  await saveAllLinks(links.filter((l) => l.id !== id));
};

export const clearCompletedLinks = async (): Promise<void> => {
  const links = await getAllLinks();
  await saveAllLinks(links.filter((l) => l.status !== "completed"));
};

export const getLinksByNotificationId = async (
  notificationId: string,
): Promise<Link[]> => {
  const links = await getAllLinks();
  return links.filter((l) => l.notification_id === notificationId);
};

export const getSetting = async (key: string): Promise<string | null> => {
  const json = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!json) return null;
  const settings: Record<string, string> = JSON.parse(json);
  return settings[key] || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  const json = await AsyncStorage.getItem(SETTINGS_KEY);
  const settings: Record<string, string> = json ? JSON.parse(json) : {};
  settings[key] = value;
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getPendingLinkCount = async (): Promise<number> => {
  const links = await getAllLinks();
  return links.filter((l) => l.status === "pending").length;
};

export const getLinksByReminderTime = async (
  startTime: number,
  endTime: number,
): Promise<Link[]> => {
  const links = await getAllLinks();
  return links.filter(
    (l) =>
      l.status === "pending" &&
      l.reminder_type !== "no_reminder" &&
      l.reminder_time !== null &&
      l.reminder_time >= startTime &&
      l.reminder_time <= endTime,
  );
};
