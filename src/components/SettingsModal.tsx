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
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.doneButtonWrapper,
              { backgroundColor: theme.surfaceElevated },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButton, { color: theme.primary }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentInner}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                Appearance
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <Ionicons 
                      name={isDark ? "moon" : "sunny"} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.settingLabel, { color: theme.text }]}
                    >
                      Dark Mode
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {isDark ? "Currently dark" : "Currently light"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: theme.border,
                    true: theme.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                Notifications
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <Ionicons name="mail" size={20} color={theme.textSecondary} />
                  </View>
                  <View>
                    <Text
                      style={[styles.settingLabel, { color: theme.text }]}
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
                    false: theme.border,
                    true: theme.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                Data Management
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dangerCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(248, 113, 113, 0.12)'
                    : 'rgba(239, 68, 68, 0.08)',
                  borderColor: theme.error,
                },
              ]}
              onPress={handleClearCompleted}
              disabled={isClearing}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: theme.error },
                  ]}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.dangerLabel, { color: theme.error }]}>
                    {isClearing
                      ? "Clearing..."
                      : "Clear Completed Links"}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    This action cannot be undone
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                About
              </Text>
            </View>
            <View
              style={[
                styles.aboutCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.appName, { color: theme.text }]}>
                Nudge
              </Text>
              <Text
                style={[styles.appVersion, { color: theme.primary }]}
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
                A universal link saving and reminder tool.{"\n"}All data is
                stored locally on your device.
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  doneButtonWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  closeButton: {
    fontSize: 14,
    fontWeight: "700",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingIcon: {
    fontSize: 16,
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
  dangerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dangerLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
  },
  appName: {
    fontSize: 20,
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
    marginVertical: 14,
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
