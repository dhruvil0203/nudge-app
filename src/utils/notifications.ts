import Constants from "expo-constants";
import { Link } from "./database";

// expo-notifications must NEVER be statically imported in Expo Go —
// doing so causes its module-level code to call addPushTokenListener,
// which is a fatal error in Expo Go since SDK 53.
// Instead, every reference goes through getN(), which returns null in Expo Go.

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getN = (): any | null => {
  if (isExpoGo) return null;
  // Dynamic require — only executed (and thus only loads the native module)
  // when we are NOT inside Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("expo-notifications");
};

// Set up the notification display handler once at module load (non-Expo-Go only)
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReminderTime {
  trigger: { seconds: number };
  label: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const initializeNotifications = async (): Promise<void> => {
  if (isExpoGo) return; // push tokens not available in Expo Go
  const Notifications = getN();
  if (!Notifications) return;
  try {
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
      const inOneMinute = new Date(now.getTime() + 60 * 1000);
      return {
        trigger: {
          seconds: Math.round((inOneMinute.getTime() - now.getTime()) / 1000),
        },
        label: "In 1 Minute",
      };
    }
    case "in_1_hour": {
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      return {
        trigger: {
          seconds: Math.round((inOneHour.getTime() - now.getTime()) / 1000),
        },
        label: "In 1 Hour",
      };
    }
    case "tonight": {
      const tonight = new Date(now);
      tonight.setHours(20, 0, 0, 0);
      if (tonight < now) tonight.setDate(tonight.getDate() + 1);
      return {
        trigger: {
          seconds: Math.round((tonight.getTime() - now.getTime()) / 1000),
        },
        label: "Tonight at 8 PM",
      };
    }
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return {
        trigger: {
          seconds: Math.round((tomorrow.getTime() - now.getTime()) / 1000),
        },
        label: "Tomorrow at 9 AM",
      };
    }
    default:
      return null;
  }
};

export const scheduleReminder = async (
  link: Link,
  reminderType: string,
  customTime?: Date,
): Promise<string | null> => {
  const Notifications = getN();
  if (!Notifications) return null; // silently skip in Expo Go

  try {
    let trigger: number;
    const now = new Date();

    if (reminderType === "custom" && customTime) {
      trigger = Math.round((customTime.getTime() - now.getTime()) / 1000);
    } else if (reminderType !== "no_reminder") {
      const reminderTime = calculateReminderTime(reminderType);
      if (!reminderTime) return null;
      trigger = reminderTime.trigger.seconds;
    } else {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nudge Reminder",
        body: link.title || link.url,
        data: { linkId: link.id.toString(), url: link.url },
        badge: 1,
      },
      trigger: {
        type: "timeInterval",
        seconds: Math.max(trigger, 1),
        repeats: false,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return null;
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
    const now = new Date();
    const daysUntilSunday = (0 - now.getDay() + 7) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0);
    const trigger = Math.round((nextSunday.getTime() - now.getTime()) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nudge Weekly Digest",
        body: "You have pending links waiting to be reviewed",
        data: { type: "digest" },
        badge: 1,
      },
      trigger: {
        type: "timeInterval",
        seconds: Math.max(trigger, 1),
        repeats: false,
      },
    });
  } catch (error) {
    console.error("Failed to schedule weekly digest:", error);
  }
};

/** Returns a subscription object. In Expo Go returns a no-op stub. */
export const setupNotificationListeners = (
  onNotificationResponse: (response: any) => void,
) => {
  const Notifications = getN();
  if (!Notifications) {
    // Expo Go stub — return a no-op subscription so callers can safely call .remove()
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(
    onNotificationResponse,
  );
};
