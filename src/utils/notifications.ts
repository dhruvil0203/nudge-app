import Constants from "expo-constants";
import { Link, getPendingLinkCount } from "./database";

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const getN = (): any | null => {
  if (isExpoGo) return null;
  return require("expo-notifications");
};

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
  trigger: { seconds: number };
  label: string;
}

export const initializeNotifications = async (): Promise<void> => {
  if (isExpoGo) return;
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
  if (!Notifications) return null;

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

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nudge Weekly Digest",
        body: digestBody,
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
