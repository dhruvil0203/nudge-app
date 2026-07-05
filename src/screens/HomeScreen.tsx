import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useLinks } from "../hooks/useLinks";
import { Link } from "../utils/database";
import { LinksList } from "../components/LinksList";
import { AddLinkModal } from "../components/AddLinkModal";
import { ReminderPicker } from "../components/ReminderPicker";
import {
  getSetting,
} from "../utils/database";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchOpenGraphData,
  normalizeUrl,
  isValidUrl,
} from "../utils/metadata";
import { scheduleReminder, cancelReminder } from "../utils/notifications";
import { getClipboardUrl } from "../utils/clipboard";

type TabType = "pending" | "completed";

interface HomeScreenProps {
  navigation?: any;
  route?: {
    params?: {
      addLinkUrl?: string;
    };
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { showToast, showConfirm } = useToast();
  const insets = useSafeAreaInsets();
  const {
    pendingLinks,
    completedLinks,
    loading,
    addLink,
    updateReminder,
    markComplete,
    deleteLink,
  } = useLinks();

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [addLinkModalVisible, setAddLinkModalVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [selectedLinkForReminder, setSelectedLinkForReminder] =
    useState<Link | null>(null);
  const [defaultReminder, setDefaultReminder] = useState("no_reminder");
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [defaultUrl, setDefaultUrl] = useState<string>("");
  const [bottomNavSelected, setBottomNavSelected] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fabScale = useRef(new Animated.Value(1)).current;
  const tabPillAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
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
    Animated.spring(tabPillAnim, {
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
      if (digestEnabled !== null)
        setWeeklyDigestEnabled(digestEnabled === "1");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const checkClipboardOnMount = async () => {
    try {
      await getClipboardUrl();
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
        });
        throw new Error("Invalid URL");
      }

      const metadata = await fetchOpenGraphData(normalizedUrl);

      const newLink = await addLink(
        normalizedUrl,
        metadata.title,
        metadata.description,
        metadata.image,
        metadata.domain,
        "normal",
      );

      if (defaultReminder !== "no_reminder") {
        try {
          const notificationId = await scheduleReminder(
            newLink,
            defaultReminder,
          );
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
      throw error;
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
            message:
              scheduleError?.message || "Cannot set reminder in the past.",
            type: "warning",
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

  const filterLinks = (links: Link[]): Link[] => {
    if (!Array.isArray(links)) return [];
    if (!searchQuery.trim()) return links;
    const q = searchQuery.toLowerCase().trim();
    return links.filter(
      (link) =>
        link &&
        ((link.title && link.title.toLowerCase().includes(q)) ||
        link.url?.toLowerCase().includes(q)),
    );
  };

  const displayLinks = filterLinks(
    activeTab === "pending" ? pendingLinks : completedLinks,
  );
  const pendingCount = Array.isArray(pendingLinks) ? pendingLinks.length : 0;
  const completedCount = Array.isArray(completedLinks) ? completedLinks.length : 0;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { backgroundColor: theme.warmCream }]}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
          }}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
        <View style={[styles.headerContent, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🧡</Text>
              <View>
                <Text style={styles.title}>Nudge</Text>
                <Text style={styles.subtitle}>Save now. Nudge later.</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate("Profile")}
            >
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: isSearchFocused ? theme.primary : theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search links..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        style={[
          styles.tabBarContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View
          style={[styles.tabBar, { backgroundColor: theme.surfaceElevated }]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "pending" && [
                styles.tabActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "pending"
                      ? "#FFFFFF"
                      : theme.textSecondary,
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
                        ? "rgba(255,255,255,0.3)"
                        : theme.primary,
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
              activeTab === "completed" && [
                styles.tabActive,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveTab("completed")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={
                activeTab === "completed" ? "#FFFFFF" : theme.tabInactive
              }
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "completed"
                      ? "#FFFFFF"
                      : theme.textSecondary,
                  fontWeight: activeTab === "completed" ? "700" : "500",
                },
              ]}
            >
              Completed
            </Text>
            {completedCount > 0 && (
              <View
                style={[
                  styles.tabCount,
                  {
                    backgroundColor:
                      activeTab === "completed"
                        ? "rgba(255,255,255,0.3)"
                        : theme.tabInactive,
                  },
                ]}
              >
                <Text style={styles.tabCountText}>{completedCount}</Text>
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
          searchQuery
            ? "No links match your search"
            : activeTab === "pending"
              ? "No pending links"
              : "No completed links"
        }
        showCompleted={activeTab === "completed"}
      />

      <Animated.View
        style={[
          styles.fabContainer,
          { bottom: 96, transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: theme.primary,
              ...Platform.select({
                ios: {
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 8,
                },
              }),
            },
          ]}
          onPress={handleFabPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.7}
          onPress={() => setBottomNavSelected("home")}
        >
          <Ionicons
            name={bottomNavSelected === "home" ? "home" : "home-outline"}
            size={22}
            color={
              bottomNavSelected === "home"
                ? theme.primary
                : theme.tabInactive
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setBottomNavSelected("stats");
            navigation?.navigate("Stats");
          }}
        >
          <Ionicons
            name={
              bottomNavSelected === "stats"
                ? "bar-chart"
                : "bar-chart-outline"
            }
            size={22}
            color={
              bottomNavSelected === "stats"
                ? theme.primary
                : theme.tabInactive
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setBottomNavSelected("settings");
            navigation?.navigate("Settings");
          }}
        >
          <Ionicons
            name={
              bottomNavSelected === "settings"
                ? "settings"
                : "settings-outline"
            }
            size={22}
            color={
              bottomNavSelected === "settings"
                ? theme.primary
                : theme.tabInactive
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setBottomNavSelected("profile");
            navigation?.navigate("Profile");
          }}
        >
          <Ionicons
            name={
              bottomNavSelected === "profile" ? "person" : "person-outline"
            }
            size={22}
            color={
              bottomNavSelected === "profile"
                ? theme.primary
                : theme.tabInactive
            }
          />
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "relative",
    minHeight: 160,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {},
  tabLabel: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  tabCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  tabCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  bottomNavItem: {
    padding: 10,
  },
});

export default HomeScreen;
