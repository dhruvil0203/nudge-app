import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
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
import { Ionicons } from "@expo/vector-icons";
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
  const { theme, isDark } = useTheme();
  const { showToast, showConfirm } = useToast();
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

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "pending" ? 0 : 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

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

  const handleAddLink = async (url: string) => {
    try {
      setFetchingMetadata(true);
      const normalizedUrl = normalizeUrl(url);

      if (!isValidUrl(normalizedUrl)) {
        showToast({
          message: "Please enter a valid URL",
          type: "warning",
          icon: "🔗",
        });
        return;
      }

      const metadata = await fetchOpenGraphData(normalizedUrl);

      const newLink = await addLink(
        normalizedUrl,
        metadata.title,
        metadata.description,
        metadata.image,
        metadata.domain,
        "normal"
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

      showToast({
        message: "Link saved",
        type: "success",
      });
      setDefaultUrl("");
    } catch (error) {
      console.error("Error adding link:", error);
      showToast({
        message: "Failed to save link. Please try again.",
        type: "error",
      });
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
      showToast({
        message: "Marked as done",
        type: "success",
      });
    } catch (error) {
      console.error("Error marking link complete:", error);
      showToast({
        message: "Failed to mark link as complete",
        type: "error",
      });
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
          showToast({
            message: scheduleError?.message || "Cannot set reminder in the past.",
            type: "warning",
            icon: "⏰",
          });
          return;
        }
      }

      await updateReminder(
        selectedLinkForReminder.id,
        reminderType,
        reminderTime,
        notificationId,
      );
      showToast({
        message: "Reminder updated",
        type: "success",
      });
      setSelectedLinkForReminder(null);
    } catch (error) {
      console.error("Error setting reminder:", error);
      showToast({
        message: "Failed to set reminder",
        type: "error",
      });
    }
  };

  const handleDeleteLink = (link: Link) => {
    showConfirm({
      title: "Delete Nudge",
      message: "Remove this nudge permanently.\nThis action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      icon: "trash-outline",
      onConfirm: async () => {
        try {
          if (link.notification_id) {
            await cancelReminder(link.notification_id);
          }
          await deleteLink(link.id);
          showToast({
            message: "Link deleted",
            type: "info",
          });
        } catch (error) {
          console.error("Error deleting link:", error);
          showToast({
            message: "Failed to delete link",
            type: "error",
          });
        }
      },
    });
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
      showToast({
        message: "Completed links cleared",
        type: "success",
      });
    } catch (error) {
      console.error("Error clearing completed:", error);
      showToast({
        message: "Failed to clear completed links",
        type: "error",
      });
    }
  };

  const handleWeeklyDigestChange = async (value: boolean) => {
    setWeeklyDigestEnabled(value);
    await setSetting("weekly_digest_enabled", value ? "1" : "0");
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.9,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    setAddLinkModalVisible(true);
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
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>Nudge</Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text style={styles.countBadgeText}>{pendingCount}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setSettingsModalVisible(true)}
          style={[
            styles.settingsButton,
            { backgroundColor: theme.surfaceElevated },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.tabContainer}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                backgroundColor: theme.primary,
                transform: [
                  {
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "pending" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={18} color={activeTab === "pending" ? theme.primary : theme.tabInactive} style={styles.tabEmoji} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "pending"
                      ? theme.primary
                      : theme.tabInactive,
                  fontWeight: activeTab === "pending" ? "700" : "500",
                },
              ]}
            >
              Pending
            </Text>
            {pendingCount > 0 && (
              <View
                style={[
                  styles.tabCount,
                  {
                    backgroundColor:
                      activeTab === "pending"
                        ? theme.primary
                        : theme.tabInactive,
                  },
                ]}
              >
                <Text style={styles.tabCountText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "completed" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("completed")}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={activeTab === "completed" ? theme.primary : theme.tabInactive} style={styles.tabEmoji} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "completed"
                      ? theme.primary
                      : theme.tabInactive,
                  fontWeight: activeTab === "completed" ? "700" : "500",
                },
              ]}
            >
              Completed
            </Text>
            {completedLinks.length > 0 && (
              <View
                style={[
                  styles.tabCount,
                  {
                    backgroundColor:
                      activeTab === "completed"
                        ? theme.primary
                        : theme.tabInactive,
                  },
                ]}
              >
                <Text style={styles.tabCountText}>
                  {completedLinks.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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

      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={handleFabPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButtonText: {
    fontSize: 20,
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 6,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    fontSize: 30,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 34,
  },
});
