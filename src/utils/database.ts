import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "linkstash.db";

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(
      `
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        image TEXT,
        domain TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        reminder_type TEXT DEFAULT 'no_reminder',
        reminder_time INTEGER,
        notification_id TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      INSERT OR IGNORE INTO settings (key, value) VALUES ('default_reminder', 'no_reminder');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('weekly_digest_enabled', '1');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_mode', 'light');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('last_digest_timestamp', '0');
    `
    );
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

export const getDatabase = () => db;

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

export const addLink = async (
  url: string,
  title: string | null = null,
  description: string | null = null,
  image: string | null = null,
  domain: string | null = null,
  priority: string = "normal",
): Promise<Link> => {
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO links (url, title, description, image, domain, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [url, title, description, image, domain, priority, now, now],
  );

  const link = await db.getFirstAsync<Link>(
    "SELECT * FROM links WHERE id = ?",
    [result.lastInsertRowId],
  );

  return link!;
};

export const updateLinkReminder = async (
  linkId: number,
  reminderType: string,
  reminderTime: number | null = null,
  notificationId: string | null = null,
): Promise<void> => {
  await db.runAsync(
    `UPDATE links SET reminder_type = ?, reminder_time = ?, notification_id = ?, updated_at = ?
     WHERE id = ?`,
    [reminderType, reminderTime, notificationId, Date.now(), linkId],
  );
};

export const markLinkComplete = async (linkId: number): Promise<void> => {
  await db.runAsync(
    `UPDATE links SET status = 'completed', completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [Date.now(), Date.now(), linkId],
  );
};

export const updateLinkPriority = async (
  linkId: number,
  priority: string,
): Promise<void> => {
  await db.runAsync(
    `UPDATE links SET priority = ?, updated_at = ?
     WHERE id = ?`,
    [priority, Date.now(), linkId],
  );
};

export const getPendingLinks = async (): Promise<Link[]> => {
  const links = await db.getAllAsync<Link>(
    `SELECT * FROM links WHERE status = 'pending' ORDER BY created_at DESC`,
  );
  return links || [];
};

export const getCompletedLinks = async (): Promise<Link[]> => {
  const links = await db.getAllAsync<Link>(
    `SELECT * FROM links WHERE status = 'completed' ORDER BY completed_at DESC`,
  );
  return links || [];
};

export const getLinkById = async (id: number): Promise<Link | null> => {
  const link = await db.getFirstAsync<Link>(
    "SELECT * FROM links WHERE id = ?",
    [id],
  );
  return link || null;
};

export const deleteLink = async (id: number): Promise<void> => {
  await db.runAsync("DELETE FROM links WHERE id = ?", [id]);
};

export const clearCompletedLinks = async (): Promise<void> => {
  await db.runAsync('DELETE FROM links WHERE status = "completed"');
};

export const getLinksByNotificationId = async (
  notificationId: string,
): Promise<Link[]> => {
  const links = await db.getAllAsync<Link>(
    "SELECT * FROM links WHERE notification_id = ?",
    [notificationId],
  );
  return links || [];
};

export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await db.getFirstAsync<Settings>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return setting?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
};

export const getPendingLinkCount = async (): Promise<number> => {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM links WHERE status = 'pending'`,
  );
  return result?.count || 0;
};

export const getLinksByReminderTime = async (
  startTime: number,
  endTime: number,
): Promise<Link[]> => {
  const links = await db.getAllAsync<Link>(
    `SELECT * FROM links 
     WHERE status = 'pending' 
     AND reminder_type != 'no_reminder'
     AND reminder_time >= ? 
     AND reminder_time <= ?`,
    [startTime, endTime],
  );
  return links || [];
};
