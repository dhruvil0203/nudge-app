import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useLinks } from "../hooks/useLinks";
import { LinksList } from "../components/LinksList";
import { AddLinkModal } from "../components/AddLinkModal";
import { ReminderPicker } from "../components/ReminderPicker";
import { SettingsModal } from "../components/SettingsModal";
import {
  addLink as dbAddLink,
  updateLinkReminder,
  getSetting,
  setSetting,
} from "../utils/database";
import {
  fetchOpenGraphData,
  normalizeUrl,
  isValidUrl,
} from "../utils/metadata";
import { scheduleReminder, cancelReminder } from "../utils/notifications";
import { getClipboardUrl } from "../utils/clipboard";
import { Link } from "../utils/database";

type TabType = "pending" | "completed";

interface HomeScreenProps {
  route?: {
    params?: {
      addLinkUrl?: string;
    };
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const { theme } = useTheme();
  const {
    pendingLinks,
    completedLinks,
    loading,
    loadLinks,
    addLink,
    updateReminder,
    markComplete,
    updatePriority,
    deleteLink,
    clearCompleted,
  } = useLinks();

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [addLinkModalVisible, setAddLinkModalVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedLinkForReminder, setSelectedLinkForReminder] =
    useState<Link | null>(null);
  const [defaultReminder, setDefaultReminder] = useState("no_reminder");
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [defaultUrl, setDefaultUrl] = useState<string>("");

  useFocusEffect(
    React.useCallback(() => {
      loadLinks();
      checkClipboardOnMount();
    }, []),
  );

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (route?.params?.addLinkUrl) {
      setDefaultUrl(route.params.addLinkUrl);
      setAddLinkModalVisible(true);
    }
  }, [route?.params?.addLinkUrl]);

  const loadSettings = async () => {
    try {
      const defaultRem = await getSetting("default_reminder");
      const digestEnabled = await getSetting("weekly_digest_enabled");
      if (defaultRem) setDefaultReminder(defaultRem);
      if (digestEnabled !== null) setWeeklyDigestEnabled(digestEnabled === "1");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const checkClipboardOnMount = async () => {
    try {
      const clipboardUrl = await getClipboardUrl();
      if (clipboardUrl) {
      }
    } catch (error) {
      console.error("Failed to check clipboard:", error);
    }
  };

  const handleAddLink = async (url: string, priority: string) => {
    try {
      setFetchingMetadata(true);
      const normalizedUrl = normalizeUrl(url);

      if (!isValidUrl(normalizedUrl)) {
        Alert.alert("Invalid URL", "Please enter a valid URL");
        return;
      }

      const metadata = await fetchOpenGraphData(normalizedUrl);

      const newLink = await addLink(
        normalizedUrl,
        metadata.title,
        metadata.description,
        metadata.image,
        metadata.domain,
        priority,
      );

      if (defaultReminder !== "no_reminder") {
        try {
          const notificationId = await scheduleReminder(newLink, defaultReminder);
          if (notificationId) {
            await updateReminder(
              newLink.id,
              defaultReminder,
              Date.now(),
              notificationId,
            );
          }
        } catch (scheduleError: any) {
          console.warn("Default reminder scheduling failed:", scheduleError);
        }
      }

      Alert.alert("Success", "Link saved successfully");
      setDefaultUrl("");
    } catch (error) {
      console.error("Error adding link:", error);
      Alert.alert("Error", "Failed to save link");
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleMarkDone = async (link: Link) => {
    try {
      if (link.notification_id) {
        await cancelReminder(link.notification_id);
      }
      await markComplete(link.id);
      Alert.alert("Done", "Link marked as complete");
    } catch (error) {
      console.error("Error marking link complete:", error);
      Alert.alert("Error", "Failed to mark link as complete");
    }
  };

  const handleSnooze = (link: Link) => {
    setSelectedLinkForReminder(link);
    setReminderPickerVisible(true);
  };

  const handleReminderSelect = async (
    reminderType: string,
    customDate?: Date,
  ) => {
    if (!selectedLinkForReminder) return;

    try {
      if (selectedLinkForReminder.notification_id) {
        await cancelReminder(selectedLinkForReminder.notification_id);
      }

      let notificationId: string | null = null;
      let reminderTime: number | null = null;

      if (reminderType !== "no_reminder") {
        try {
          notificationId = await scheduleReminder(
            selectedLinkForReminder,
            reminderType,
            customDate,
          );
          reminderTime = customDate ? customDate.getTime() : Date.now();
        } catch (scheduleError: any) {
          Alert.alert(
            "Invalid Time",
            scheduleError?.message || "Cannot set reminder in the past.",
          );
          return;
        }
      }

      await updateReminder(
        selectedLinkForReminder.id,
        reminderType,
        reminderTime,
        notificationId,
      );
      Alert.alert("Reminder Set", "Your reminder has been updated");
      setSelectedLinkForReminder(null);
    } catch (error) {
      console.error("Error setting reminder:", error);
      Alert.alert("Error", "Failed to set reminder");
    }
  };

  const handleDeleteLink = (link: Link) => {
    Alert.alert("Delete Link", "Are you sure you want to delete this link?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (link.notification_id) {
              await cancelReminder(link.notification_id);
            }
            await deleteLink(link.id);
            Alert.alert("Deleted", "Link has been deleted");
          } catch (error) {
            console.error("Error deleting link:", error);
            Alert.alert("Error", "Failed to delete link");
          }
        },
      },
    ]);
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
      Alert.alert("Cleared", "All completed links have been deleted");
    } catch (error) {
      console.error("Error clearing completed:", error);
      Alert.alert("Error", "Failed to clear completed links");
    }
  };

  const handleWeeklyDigestChange = async (value: boolean) => {
    setWeeklyDigestEnabled(value);
    await setSetting("weekly_digest_enabled", value ? "1" : "0");
  };

  const displayLinks = activeTab === "pending" ? pendingLinks : completedLinks;
  const pendingCount = pendingLinks.length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Nudge</Text>
        <TouchableOpacity
          onPress={() => setSettingsModalVisible(true)}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.tabBackground, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            {
              borderBottomColor:
                activeTab === "pending" ? theme.primary : "transparent",
            },
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  activeTab === "pending" ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === "pending" ? "600" : "400",
              },
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              borderBottomColor:
                activeTab === "completed" ? theme.primary : "transparent",
            },
          ]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  activeTab === "completed"
                    ? theme.primary
                    : theme.textSecondary,
                fontWeight: activeTab === "completed" ? "600" : "400",
              },
            ]}
          >
            Completed ({completedLinks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <LinksList
        links={displayLinks}
        loading={loading}
        onLinkOpen={() => {}}
        onMarkDone={handleMarkDone}
        onSnooze={handleSnooze}
        onDelete={handleDeleteLink}
        emptyMessage={
          activeTab === "pending" ? "No pending links" : "No completed links"
        }
        showCompleted={activeTab === "completed"}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setAddLinkModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddLinkModal
        visible={addLinkModalVisible}
        onClose={() => {
          setAddLinkModalVisible(false);
          setDefaultUrl("");
        }}
        onAdd={handleAddLink}
        loading={fetchingMetadata}
        defaultUrl={defaultUrl}
      />

      <ReminderPicker
        visible={reminderPickerVisible}
        selectedReminder={
          selectedLinkForReminder?.reminder_type || "no_reminder"
        }
        onSelect={handleReminderSelect}
        onClose={() => setReminderPickerVisible(false)}
      />

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        defaultReminder={defaultReminder}
        onDefaultReminderChange={(value) => {
          setDefaultReminder(value);
          setSetting("default_reminder", value);
        }}
        weeklyDigestEnabled={weeklyDigestEnabled}
        onWeeklyDigestChange={handleWeeklyDigestChange}
        onClearCompleted={handleClearCompleted}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: 12,
    marginTop: -4,
    marginRight: -8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  fabText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 36,
  },
});
