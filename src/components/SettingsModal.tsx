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
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

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

  const handleClearCompleted = () => {
    Alert.alert(
      "Clear Completed Links",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { text: "Clear", onPress: onClearCompleted, style: "destructive" },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: theme.primary }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Display</Text>
            <View style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
            <View style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Weekly Digest</Text>
              <Switch value={weeklyDigestEnabled} onValueChange={onWeeklyDigestChange} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>
            <TouchableOpacity style={[styles.dangerButton, { backgroundColor: theme.error }]} onPress={handleClearCompleted} disabled={isClearing}>
              <Text style={styles.dangerButtonText}>{isClearing ? "Clearing..." : "Clear Completed Links"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>LinkStash v1.0.0</Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>A universal link saving and reminder tool</Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>All data is stored locally on your device</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "600" },
  closeButton: { fontSize: 16, fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, borderWidth: 1 },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  dangerButton: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  dangerButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  infoBox: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
  infoText: { fontSize: 13, marginVertical: 4, lineHeight: 18 },
});
