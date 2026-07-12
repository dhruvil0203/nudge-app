import { Platform } from "react-native";
import Constants from "expo-constants";
import { getPendingLinkCount } from "./database";
import type { Link } from "../types";
import type { NotificationPayload } from "../types";

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const CHANNEL_ID = "nudge-reminders";

// Lazy-load expo-notifications only when needed and not in Expo Go
let NotificationsModule: typeof import("expo-notifications") | null = null;

async function getNotificationsModule(): Promise<typeof import("expo-notifications") | null> {
  if (isExpoGo) return null;
  if (NotificationsModule) return NotificationsModule;
  try {
    NotificationsModule = require("expo-notifications");
    return NotificationsModule;
  } catch {
    console.warn("[Notifications] expo-notifications not available");
    return null;
  }
}

const ensureAndroidChannel = async (N: typeof import("expo-notifications")): Promise<void> => {
  if (Platform.OS !== "android") return;
  try {
    const existing = await N.getNotificationChannelAsync(CHANNEL_ID);
    if (!existing) {
      await N.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Nudge Reminders",
        importance: N.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.warn("[Notifications] Failed to create notification channel:", error);
  }
};

export const initializeNotifications = async (): Promise<void> => {
  const N = await getNotificationsModule();
  if (!N) return;

  try {
    await ensureAndroidChannel(N);

    const { granted } = await N.getPermissionsAsync();
    if (!granted) {
      const result = await N.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("[Notifications] Permission denied by user");
      }
    }

    // Set notification handler
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn("[Notifications] Initialization error:", error);
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const N = await getNotificationsModule();
  if (!N) return false;

  try {
    const existingPermissions = await N.getPermissionsAsync();
    if (existingPermissions.granted) return true;

    const result = await N.requestPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.warn("[Notifications] Permission request error:", error);
    return false;
  }
};

export interface ReminderTime {
  targetDate: Date;
  label: string;
}

export const calculateReminderTime = (
  reminderType: string,
): ReminderTime | null => {
  const now = new Date();

  switch (reminderType) {
    case "in_1_minute": {
      const target = new Date(now.getTime() + 60 * 1000);
      return { targetDate: target, label: "In 1 Minute" };
    }
    case "in_1_hour": {
      const target = new Date(now.getTime() + 60 * 60 * 1000);
      return { targetDate: target, label: "In 1 Hour" };
    }
    case "tonight": {
      const target = new Date(now);
      target.setHours(20, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      return { targetDate: target, label: "Tonight at 8 PM" };
    }
    case "tomorrow": {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return { targetDate: target, label: "Tomorrow at 9 AM" };
    }
    default:
      return null;
  }
};

const MIN_SCHEDULE_BUFFER_MS = 10_000;

const buildTrigger = (targetDate: Date): Record<string, unknown> => {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;

  if (diffMs < MIN_SCHEDULE_BUFFER_MS) {
    throw new Error(
      "Cannot schedule a notification in the past or too close to now.",
    );
  }

  const trigger: Record<string, unknown> = {
    type: "date",
    date: targetDate, // Must be Date object for expo-notifications
  };

  if (Platform.OS === "android") {
    trigger.channelId = CHANNEL_ID;
  }

  return trigger;
};

export const scheduleReminder = async (
  link: Link,
  reminderType: string,
  customTime?: Date,
): Promise<string | null> => {
  const N = await getNotificationsModule();
  if (!N) return null;

  await ensureAndroidChannel(N);

  let targetDate: Date;

  if (reminderType === "custom" && customTime) {
    targetDate = customTime;
  } else if (reminderType !== "no_reminder") {
    const reminderTime = calculateReminderTime(reminderType);
    if (!reminderTime) return null;
    targetDate = reminderTime.targetDate;
  } else {
    return null;
  }

  const now = Date.now();
  if (targetDate.getTime() <= now + MIN_SCHEDULE_BUFFER_MS) {
    throw new Error(
      "Reminder time must be in the future. Please select a later time.",
    );
  }

  try {
    const trigger = buildTrigger(targetDate);

    const content: Record<string, unknown> = {
      title: "Nudge Reminder",
      body: "📌 You have a pending link to review!",
      data: { linkId: String(link.id), url: link.url } satisfies NotificationPayload,
      badge: 1,
      sound: "default",
    };

    if (Platform.OS === "android") {
      content.channelId = CHANNEL_ID;
    }

    const notificationId = await N.scheduleNotificationAsync({
      content: content as import("expo-notifications").NotificationContentInput,
      trigger: trigger as import("expo-notifications").NotificationTriggerInput,
    });

    return notificationId;
  } catch (error) {
    console.error("[Notifications] Failed to schedule reminder:", error);
    throw error;
  }
};

export const cancelReminder = async (
  notificationId: string | null,
): Promise<void> => {
  const N = await getNotificationsModule();
  if (!N || !notificationId) return;
  try {
    await N.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("[Notifications] Failed to cancel reminder:", error);
  }
};

export const cancelAllReminders = async (): Promise<void> => {
  const N = await getNotificationsModule();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[Notifications] Failed to cancel all reminders:", error);
  }
};

export const scheduleWeeklyDigest = async (): Promise<void> => {
  const N = await getNotificationsModule();
  if (!N) return;
  try {
    await ensureAndroidChannel(N);

    const now = new Date();
    const daysUntilSunday = (0 - now.getDay() + 7) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0);

    let digestBody = "You have pending links waiting to be reviewed";
    try {
      const count = await getPendingLinkCount();
      if (count === 0) {
        digestBody = "Great job! You have no pending links. Keep it up! 🎉";
      } else if (count === 1) {
        digestBody = "You have 1 pending link waiting to be reviewed";
      } else {
        digestBody = `You have ${count} pending links waiting to be reviewed`;
      }
    } catch {
      // Use default message
    }

    const trigger = buildTrigger(nextSunday);

    const content: Record<string, unknown> = {
      title: "Nudge Weekly Digest",
      body: digestBody,
      data: { type: "digest" } satisfies NotificationPayload,
      badge: 1,
      sound: "default",
    };

    if (Platform.OS === "android") {
      content.channelId = CHANNEL_ID;
    }

    await N.scheduleNotificationAsync({
      content: content as import("expo-notifications").NotificationContentInput,
      trigger: trigger as import("expo-notifications").NotificationTriggerInput,
    });
  } catch (error) {
    console.error("[Notifications] Failed to schedule weekly digest:", error);
  }
};

export const setupNotificationListener = (
  onNotificationResponse: (data: Record<string, unknown>) => void,
): { remove: () => void } => {
  const subscription = { remove: () => {} };

  getNotificationsModule().then((N) => {
    if (!N) return;
    const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onNotificationResponse(data);
    });
    (subscription as { remove: () => void }).remove = () => sub.remove();
  });

  return subscription;
};

export const getLastNotificationResponse = async (): Promise<Record<string, unknown> | null> => {
  const N = await getNotificationsModule();
  if (!N) return null;
  try {
    const response = await N.getLastNotificationResponseAsync();
    if (response) {
      return response.notification.request.content.data as Record<string, unknown>;
    }
  } catch {
    // Ignore
  }
  return null;
};
