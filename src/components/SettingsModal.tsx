import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { Ionicons } from "@expo/vector-icons";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  defaultReminder: string;
  onDefaultReminderChange: (value: string) => void;
  weeklyDigestEnabled: boolean;
  onWeeklyDigestChange: (value: boolean) => void;
  onClearCompleted: () => Promise<void>;
  isClearing?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  defaultReminder,
  onDefaultReminderChange,
  weeklyDigestEnabled,
  onWeeklyDigestChange,
  onClearCompleted,
  isClearing = false,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { showConfirm } = useToast();

  const handleClearCompleted = () => {
    showConfirm({
      title: "Clear Completed Links",
      message: "Are you sure? This action cannot be undone.",
      confirmText: "Clear All",
      cancelText: "Cancel",
      destructive: true,
      icon: "trash-outline",
      onConfirm: onClearCompleted,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.headerImageContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&q=80",
            }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.headerImageOverlay,
              {
                backgroundColor: isDark
                  ? "rgba(26, 20, 18, 0.85)"
                  : "rgba(251, 247, 244, 0.85)",
              },
            ]}
          />
          <View style={styles.headerContent}>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? "#F5EDE8" : "#3D2E22" },
              ]}
            >
              Settings
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.headerLeft} />
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.doneButtonWrapper,
              { backgroundColor: theme.surfaceElevated },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentInner}
        >
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Appearance
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: theme.warmPeach },
                    ]}
                  >
                    <Ionicons
                      name={isDark ? "moon" : "sunny"}
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: theme.text },
                      ]}
                    >
                      Theme
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
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
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Notifications
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: theme.warmPeach },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: theme.text },
                      ]}
                    >
                      Weekly Digest
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Get a summary of pending links
                    </Text>
                  </View>
                </View>
                <Switch
                  value={weeklyDigestEnabled}
                  onValueChange={onWeeklyDigestChange}
                  trackColor={{
                    false: theme.tabInactive + "40",
                    true: theme.primary + "60",
                  }}
                  thumbColor={
                    weeklyDigestEnabled ? theme.primary : "#FFFFFF"
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              Data Management
            </Text>
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleClearCompleted}
              disabled={isClearing}
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
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.error}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: theme.error },
                      ]}
                    >
                      {isClearing
                        ? "Clearing..."
                        : "Clear Completed Links"}
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: theme.error },
                      ]}
                    >
                      This action cannot be undone
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.tabInactive}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary },
              ]}
            >
              About
            </Text>
            <View
              style={[
                styles.aboutCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={styles.aboutHeart}>🧡</Text>
              <Text
                style={[styles.appName, { color: theme.text }]}
              >
                Nudge
              </Text>
              <Text
                style={[
                  styles.appVersion,
                  { color: theme.primary },
                ]}
              >
                Version 1.0.0
              </Text>
              <View
                style={[
                  styles.aboutDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <Text
                style={[
                  styles.aboutDescription,
                  { color: theme.textSecondary },
                ]}
              >
                A universal link saving and reminder tool.{"\n"}All
                data is stored locally on your device.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    height: 160,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  headerContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 36,
  },
  doneButtonWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
