import { Platform } from "react-native";
import Constants from "expo-constants";
import { Link, getPendingLinkCount } from "./database";

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const getN = (): any | null => {
  if (isExpoGo) return null;
  return require("expo-notifications");
};

const CHANNEL_ID = "nudge-reminders";

const N = getN();
if (N) {
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface ReminderTime {
  targetDate: Date;
  label: string;
}

const ensureAndroidChannel = async (Notifications: any): Promise<void> => {
  if (Platform.OS !== "android") return;
  try {
    const existing = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
    if (!existing) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Nudge Reminders",
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.warn("Failed to create notification channel:", error);
  }
};

export const initializeNotifications = async (): Promise<void> => {
  if (isExpoGo) return;
  const Notifications = getN();
  if (!Notifications) return;

  try {
    await ensureAndroidChannel(Notifications);

    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.warn("Notifications permission error:", error);
  }
};

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

const buildTrigger = (targetDate: Date): any => {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;

  if (diffMs < MIN_SCHEDULE_BUFFER_MS) {
    throw new Error(
      "Cannot schedule a notification in the past or too close to now.",
    );
  }

  const trigger: any = {
    type: "date",
    date: targetDate.getTime(),
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
  const Notifications = getN();
  if (!Notifications) return null;

  await ensureAndroidChannel(Notifications);

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

    const content: any = {
      title: "Nudge Reminder",
      body: "📌 You have a pending link to review!",
      data: { linkId: link.id.toString(), url: link.url },
      badge: 1,
      sound: "default",
    };

    if (Platform.OS === "android") {
      content.channelId = CHANNEL_ID;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const found = scheduled.some(
      (n: any) => n.identifier === notificationId,
    );

    if (!found) {
      console.warn(
        "Notification was scheduled but not found in pending list. " +
          "It may have been dropped by the OS.",
      );
    }

    return notificationId;
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    throw error;
  }
};

export const cancelReminder = async (
  notificationId: string | null,
): Promise<void> => {
  const Notifications = getN();
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Failed to cancel reminder:", error);
  }
};

export const scheduleWeeklyDigest = async (): Promise<void> => {
  const Notifications = getN();
  if (!Notifications) return;
  try {
    await ensureAndroidChannel(Notifications);

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
    }

    const trigger = buildTrigger(nextSunday);

    const content: any = {
      title: "Nudge Weekly Digest",
      body: digestBody,
      data: { type: "digest" },
      badge: 1,
      sound: "default",
    };

    if (Platform.OS === "android") {
      content.channelId = CHANNEL_ID;
    }

    await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
  } catch (error) {
    console.error("Failed to schedule weekly digest:", error);
  }
};

export const setupNotificationListeners = (
  onNotificationResponse: (response: any) => void,
) => {
  const Notifications = getN();
  if (!Notifications) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(
    onNotificationResponse,
  );
};
