import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Link, Priority, LinkStatus, ExportData, StorageError, ProfileData } from "../types";

const LINKS_KEY = "@nudge/links";
const SETTINGS_KEY = "@nudge/settings";
const SCHEMA_KEY = "@nudge/schema_version";
const CURRENT_SCHEMA_VERSION = 2;

// Mutex for synchronizing async read-modify-write operations
class AsyncMutex {
  private queue: (() => Promise<void>)[] = [];
  private locked = false;

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        this.locked = true;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        }
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const linksMutex = new AsyncMutex();
const settingsMutex = new AsyncMutex();

function createStorageError(code: StorageError["code"], message: string, originalError?: unknown): StorageError {
  return { code, message, originalError };
}

function isValidLinkPriority(priority: string): priority is Priority {
  return priority === "important" || priority === "normal" || priority === "someday";
}

function isValidLinkStatus(status: string): status is LinkStatus {
  return status === "pending" || status === "completed";
}

function validateLink(link: unknown): link is Link {
  if (!link || typeof link !== "object") return false;
  const l = link as Record<string, unknown>;
  return (
    typeof l.id === "number" &&
    typeof l.url === "string" &&
    (l.title === null || typeof l.title === "string") &&
    (l.description === null || typeof l.description === "string") &&
    (l.image === null || typeof l.image === "string") &&
    (l.domain === null || typeof l.domain === "string") &&
    isValidLinkPriority(l.priority as string) &&
    isValidLinkStatus(l.status as string) &&
    typeof l.reminder_type === "string" &&
    (l.reminder_time === null || typeof l.reminder_time === "number") &&
    (l.notification_id === null || typeof l.notification_id === "string") &&
    typeof l.created_at === "number" &&
    (l.completed_at === null || typeof l.completed_at === "number") &&
    typeof l.updated_at === "number"
  );
}

function sanitizeLinks(data: unknown): Link[] {
  if (!Array.isArray(data)) return [];
  return data.filter(validateLink);
}

async function getSchemaVersion(): Promise<number> {
  try {
    const version = await AsyncStorage.getItem(SCHEMA_KEY);
    return version ? parseInt(version, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

async function setSchemaVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(SCHEMA_KEY, String(version));
}

async function runMigrations(oldVersion: number): Promise<void> {
  if (oldVersion < 1) {
    // Migration v0 -> v1: ensure all links have proper fields
    const linksJson = await AsyncStorage.getItem(LINKS_KEY);
    if (linksJson) {
      try {
        const links = JSON.parse(linksJson);
        if (Array.isArray(links)) {
          const migrated = links.map((link: Record<string, unknown>) => ({
            id: typeof link.id === "number" ? link.id : Date.now(),
            url: typeof link.url === "string" ? link.url : "",
            title: typeof link.title === "string" ? link.title : null,
            description: typeof link.description === "string" ? link.description : null,
            image: typeof link.image === "string" ? link.image : null,
            domain: typeof link.domain === "string" ? link.domain : null,
            priority: isValidLinkPriority(link.priority as string) ? link.priority : "normal",
            status: isValidLinkStatus(link.status as string) ? link.status : "pending",
            reminder_type: typeof link.reminder_type === "string" ? link.reminder_type : "no_reminder",
            reminder_time: typeof link.reminder_time === "number" ? link.reminder_time : null,
            notification_id: typeof link.notification_id === "string" ? link.notification_id : null,
            created_at: typeof link.created_at === "number" ? link.created_at : Date.now(),
            completed_at: typeof link.completed_at === "number" ? link.completed_at : null,
            updated_at: typeof link.updated_at === "number" ? link.updated_at : Date.now(),
          }));
          await AsyncStorage.setItem(LINKS_KEY, JSON.stringify(migrated));
        }
      } catch {
        // If migration fails, start fresh
        await AsyncStorage.setItem(LINKS_KEY, JSON.stringify([]));
      }
    }
    await setSchemaVersion(1);
  }

  if (oldVersion < 2) {
    // Migration v1 -> v2: compact storage, remove stale data
    try {
      const linksJson = await AsyncStorage.getItem(LINKS_KEY);
      if (linksJson) {
        const links = sanitizeLinks(JSON.parse(linksJson));
        // Only keep necessary fields for storage efficiency
        const compacted = links.map(({ id, url, title, description, image, domain, priority, status, reminder_type, reminder_time, notification_id, created_at, completed_at, updated_at }) => ({
          id, url, title, description, image, domain, priority, status,
          reminder_type, reminder_time, notification_id,
          created_at, completed_at, updated_at,
        }));
        await AsyncStorage.setItem(LINKS_KEY, JSON.stringify(compacted));
      }
    } catch {
      await AsyncStorage.setItem(LINKS_KEY, JSON.stringify([]));
    }
    await setSchemaVersion(2);
  }
}

async function safeGetItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (json === null) return fallback;
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (error) {
    console.error(`[DB] Failed to read ${key}, using fallback:`, error);
    return fallback;
  }
}

async function safeSetItem(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await AsyncStorage.setItem(key, json);
}

export const initDatabase = async (): Promise<void> => {
  try {
    const version = await getSchemaVersion();
    if (version < CURRENT_SCHEMA_VERSION) {
      await runMigrations(version);
    }

    // Initialize default settings if not present
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!settingsJson) {
      const defaults: Record<string, string> = {
        default_reminder: "no_reminder",
        weekly_digest_enabled: "1",
        theme_mode: "light",
        last_digest_timestamp: "0",
      };
      await safeSetItem(SETTINGS_KEY, defaults);
    }
  } catch (error) {
    console.error("[DB] Database initialization error:", error);
    throw error;
  }
};

export const getAllLinks = async (): Promise<Link[]> => {
  return linksMutex.acquire(async () => {
    const data = await safeGetItem<unknown>(LINKS_KEY, []);
    return sanitizeLinks(data);
  });
};

const saveAllLinks = async (links: Link[]): Promise<void> => {
  const validated = links.filter(validateLink);
  await safeSetItem(LINKS_KEY, validated);
};

export const addLink = async (
  url: string,
  title: string | null = null,
  description: string | null = null,
  image: string | null = null,
  domain: string | null = null,
  priority: Priority = "normal",
): Promise<Link> => {
  return linksMutex.acquire(async () => {
    const links = await safeGetItem<unknown>(LINKS_KEY, []);
    const validLinks = sanitizeLinks(links);
    const maxId = validLinks.length > 0 ? Math.max(...validLinks.map((l) => l.id)) : 0;
    const now = Date.now();
    const link: Link = {
      id: maxId + 1,
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
    validLinks.push(link);
    await safeSetItem(LINKS_KEY, validLinks);
    return link;
  });
};

export const updateLinkReminder = async (
  linkId: number,
  reminderType: string,
  reminderTime: number | null = null,
  notificationId: string | null = null,
): Promise<void> => {
  return linksMutex.acquire(async () => {
    const validLinks = sanitizeLinks(await safeGetItem(LINKS_KEY, []));
    const idx = validLinks.findIndex((l) => l.id === linkId);
    if (idx === -1) return;
    validLinks[idx] = {
      ...validLinks[idx],
      reminder_type: reminderType,
      reminder_time: reminderTime,
      notification_id: notificationId,
      updated_at: Date.now(),
    };
    await safeSetItem(LINKS_KEY, validLinks);
  });
};

export const markLinkComplete = async (linkId: number): Promise<void> => {
  return linksMutex.acquire(async () => {
    const validLinks = sanitizeLinks(await safeGetItem(LINKS_KEY, []));
    const idx = validLinks.findIndex((l) => l.id === linkId);
    if (idx === -1) return;
    validLinks[idx] = {
      ...validLinks[idx],
      status: "completed",
      completed_at: Date.now(),
      updated_at: Date.now(),
    };
    await safeSetItem(LINKS_KEY, validLinks);
  });
};

export const updateLinkPriority = async (
  linkId: number,
  priority: Priority,
): Promise<void> => {
  return linksMutex.acquire(async () => {
    const validLinks = sanitizeLinks(await safeGetItem(LINKS_KEY, []));
    const idx = validLinks.findIndex((l) => l.id === linkId);
    if (idx === -1) return;
    validLinks[idx] = {
      ...validLinks[idx],
      priority,
      updated_at: Date.now(),
    };
    await safeSetItem(LINKS_KEY, validLinks);
  });
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
  return linksMutex.acquire(async () => {
    const validLinks = sanitizeLinks(await safeGetItem(LINKS_KEY, []));
    await safeSetItem(LINKS_KEY, validLinks.filter((l) => l.id !== id));
  });
};

export const clearCompletedLinks = async (): Promise<void> => {
  return linksMutex.acquire(async () => {
    const validLinks = sanitizeLinks(await safeGetItem(LINKS_KEY, []));
    await safeSetItem(LINKS_KEY, validLinks.filter((l) => l.status !== "completed"));
  });
};

export const getLinksByNotificationId = async (
  notificationId: string,
): Promise<Link[]> => {
  const links = await getAllLinks();
  return links.filter((l) => l.notification_id === notificationId);
};

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!json) return null;
    const settings: Record<string, string> = JSON.parse(json);
    return settings[key] || null;
  } catch {
    return null;
  }
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  return settingsMutex.acquire(async () => {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings: Record<string, string> = json ? JSON.parse(json) : {};
    settings[key] = value;
    await safeSetItem(SETTINGS_KEY, settings);
  });
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

export const exportAllData = async (profile: ProfileData | null): Promise<string> => {
  const links = await getAllLinks();
  const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
  const settings: Record<string, string> = settingsJson ? JSON.parse(settingsJson) : {};

  const exportData: ExportData = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    links,
    settings,
    profile,
  };

  return JSON.stringify(exportData, null, 2);
};

export const importAllData = async (jsonString: string): Promise<void> => {
  let data: ExportData;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid import data format");
  }

  if (!data || typeof data !== "object" || typeof data.version !== "number") {
    throw new Error("Invalid import data structure");
  }

  if (data.version < 1 || data.version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported data version: ${data.version}`);
  }

  const validLinks = sanitizeLinks(data.links);

  await linksMutex.acquire(async () => {
    await safeSetItem(LINKS_KEY, validLinks);
  });

  if (data.settings && typeof data.settings === "object") {
    await settingsMutex.acquire(async () => {
      await safeSetItem(SETTINGS_KEY, data.settings);
    });
  }
};

export const recoverCorruptedData = async (): Promise<boolean> => {
  try {
    // Test if current data is readable
    const linksJson = await AsyncStorage.getItem(LINKS_KEY);
    if (linksJson) {
      JSON.parse(linksJson);
    }
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (settingsJson) {
      JSON.parse(settingsJson);
    }
    return false; // Data is healthy
  } catch {
    // Data is corrupted - attempt recovery
    try {
      await AsyncStorage.setItem(LINKS_KEY, JSON.stringify([]));
      const defaults: Record<string, string> = {
        default_reminder: "no_reminder",
        weekly_digest_enabled: "1",
        theme_mode: "light",
        last_digest_timestamp: "0",
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
      await setSchemaVersion(CURRENT_SCHEMA_VERSION);
      return true; // Recovery succeeded
    } catch {
      return false; // Recovery failed
    }
  }
};
