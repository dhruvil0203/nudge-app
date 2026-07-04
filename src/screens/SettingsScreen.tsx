import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useLinks } from "../hooks/useLinks";
import { getSetting, setSetting } from "../utils/database";
import { Ionicons } from "@expo/vector-icons";

interface SettingsScreenProps {
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { showConfirm, showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { clearCompleted } = useLinks();
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [defaultReminder, setDefaultReminder] = useState("no_reminder");

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const digestEnabled = await getSetting("weekly_digest_enabled");
      const defaultRem = await getSetting("default_reminder");
      if (digestEnabled !== null) setWeeklyDigestEnabled(digestEnabled === "1");
      if (defaultRem) setDefaultReminder(defaultRem);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleWeeklyDigestChange = async (value: boolean) => {
    setWeeklyDigestEnabled(value);
    await setSetting("weekly_digest_enabled", value ? "1" : "0");
  };

  const handleClearCompleted = () => {
    showConfirm({
      title: "Clear Completed Links",
      message: "Are you sure? This action cannot be undone.",
      confirmText: "Clear All",
      cancelText: "Cancel",
      destructive: true,
      icon: "trash-outline",
      onConfirm: async () => {
        try {
          await clearCompleted();
          showToast({ message: "Completed links cleared", type: "success" });
        } catch (error) {
          showToast({ message: "Failed to clear completed links", type: "error" });
        }
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Appearance
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.warmPeach }]}>
                  <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    {isDark ? "Dark Mode" : "Cozy Latte"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.tabInactive + "40",
                  true: theme.primary + "60",
                }}
                thumbColor={isDark ? theme.primary : "#FFFFFF"}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Notifications
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.warmPeach }]}>
                  <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Weekly Digest</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Get a summary of pending links
                  </Text>
                </View>
              </View>
              <Switch
                value={weeklyDigestEnabled}
                onValueChange={handleWeeklyDigestChange}
                trackColor={{
                  false: theme.tabInactive + "40",
                  true: theme.primary + "60",
                }}
                thumbColor={weeklyDigestEnabled ? theme.primary : "#FFFFFF"}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Data Management
          </Text>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleClearCompleted}
            activeOpacity={0.7}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(220, 38, 38, 0.08)",
                    },
                  ]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.error }]}>
                    Clear Completed Links
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.error }]}>
                    This action cannot be undone
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.tabInactive} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            About
          </Text>
          <View style={[styles.aboutCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.aboutHeart}>🧡</Text>
            <Text style={[styles.appName, { color: theme.text }]}>Nudge</Text>
            <Text style={[styles.appVersion, { color: theme.primary }]}>Version 1.0.0</Text>
            <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.aboutDescription, { color: theme.textSecondary }]}>
              A universal link saving and reminder tool.{"\n"}All data is stored locally on your device.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  aboutHeart: {
    fontSize: 32,
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  aboutDivider: {
    height: 1,
    width: "80%",
    marginVertical: 16,
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});

export default SettingsScreen;
