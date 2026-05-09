import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { REMINDER_LABELS, REMINDER_OPTIONS } from "../constants";

interface ReminderPickerProps {
  visible: boolean;
  selectedReminder: string;
  onSelect: (reminderType: string, customDate?: Date) => void;
  onClose: () => void;
}

export const ReminderPicker: React.FC<ReminderPickerProps> = ({
  visible,
  selectedReminder,
  onSelect,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const reminders = [
    REMINDER_OPTIONS.NO_REMINDER,
    REMINDER_OPTIONS.IN_1_MINUTE,
    REMINDER_OPTIONS.IN_1_HOUR,
    REMINDER_OPTIONS.TONIGHT,
    REMINDER_OPTIONS.TOMORROW,
    REMINDER_OPTIONS.CUSTOM,
  ];

  const getMinDate = (): Date => {
    const min = new Date();
    min.setSeconds(min.getSeconds() + 60);
    return min;
  };

  const clampToFuture = (date: Date): Date => {
    const min = getMinDate();
    return date < min ? new Date(min) : date;
  };

  const isInPast = selectedDate.getTime() <= Date.now() + 60_000;

  const wouldGoPast = (unit: "day" | "hour" | "minute"): boolean => {
    const test = new Date(selectedDate);
    if (unit === "day") test.setDate(test.getDate() - 1);
    else if (unit === "hour") test.setHours(test.getHours() - 1);
    else if (unit === "minute") test.setMinutes(test.getMinutes() - 1);
    return test.getTime() <= Date.now() + 60_000;
  };

  const handleSelectReminder = (reminderType: string) => {
    if (reminderType === REMINDER_OPTIONS.CUSTOM) {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      setSelectedDate(d);
      setShowDatePicker(true);
    } else {
      onSelect(reminderType);
      onClose();
    }
  };

  const handleDateConfirm = () => {
    const minTime = Date.now() + 60_000;
    if (selectedDate.getTime() > minTime) {
      onSelect(REMINDER_OPTIONS.CUSTOM, selectedDate);
      setShowDatePicker(false);
      onClose();
    } else {
      Alert.alert(
        "Invalid Time",
        "Please select a time at least 1 minute in the future.",
      );
    }
  };

  const adjustDate = (unit: "day" | "hour" | "minute", direction: 1 | -1) => {
    setSelectedDate((d) => {
      const n = new Date(d);
      if (unit === "day") n.setDate(n.getDate() + direction);
      else if (unit === "hour") n.setHours(n.getHours() + direction);
      else if (unit === "minute") n.setMinutes(n.getMinutes() + direction);
      return clampToFuture(n);
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Set Reminder
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: theme.primary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {reminders.map((reminder) => (
            <TouchableOpacity
              key={reminder}
              style={[
                styles.reminderOption,
                {
                  backgroundColor:
                    selectedReminder === reminder
                      ? theme.surface
                      : "transparent",
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleSelectReminder(reminder)}
            >
              <Text
                style={[
                  styles.reminderLabel,
                  {
                    color: theme.text,
                    fontWeight: selectedReminder === reminder ? "600" : "400",
                  },
                ]}
              >
                {REMINDER_LABELS[reminder as keyof typeof REMINDER_LABELS]}
              </Text>
              {selectedReminder === reminder && (
                <Text style={[styles.checkmark, { color: theme.primary }]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {showDatePicker && (
            <View
              style={[
                styles.datePickerContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: theme.text }]}>
                  Select Date & Time
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text
                    style={[styles.datePickerClose, { color: theme.primary }]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.selectedDateTime,
                  { color: isInPast ? "#E53935" : theme.textSecondary },
                ]}
              >
                {selectedDate.toLocaleString()}
                {isInPast ? "  ⚠️ Select a future time" : ""}
              </Text>

              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Day</Text>
                <View style={styles.timeControls}>
                  <TouchableOpacity
                    style={[
                      styles.timeBtn,
                      {
                        backgroundColor: wouldGoPast("day")
                          ? theme.textSecondary
                          : theme.primary,
                      },
                    ]}
                    onPress={() => adjustDate("day", -1)}
                    disabled={wouldGoPast("day")}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: theme.text }]}>
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeBtn, { backgroundColor: theme.primary }]}
                    onPress={() => adjustDate("day", 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Hour</Text>
                <View style={styles.timeControls}>
                  <TouchableOpacity
                    style={[
                      styles.timeBtn,
                      {
                        backgroundColor: wouldGoPast("hour")
                          ? theme.textSecondary
                          : theme.primary,
                      },
                    ]}
                    onPress={() => adjustDate("hour", -1)}
                    disabled={wouldGoPast("hour")}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: theme.text }]}>
                    {selectedDate.getHours().toString().padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeBtn, { backgroundColor: theme.primary }]}
                    onPress={() => adjustDate("hour", 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Minute</Text>
                <View style={styles.timeControls}>
                  <TouchableOpacity
                    style={[
                      styles.timeBtn,
                      {
                        backgroundColor: wouldGoPast("minute")
                          ? theme.textSecondary
                          : theme.primary,
                      },
                    ]}
                    onPress={() => adjustDate("minute", -1)}
                    disabled={wouldGoPast("minute")}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: theme.text }]}>
                    {selectedDate.getMinutes().toString().padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeBtn, { backgroundColor: theme.primary }]}
                    onPress={() => adjustDate("minute", 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: isInPast
                        ? theme.textSecondary
                        : theme.primary,
                    },
                  ]}
                  onPress={handleDateConfirm}
                  disabled={isInPast}
                >
                  <Text style={styles.datePickerButtonText}>
                    {isInPast ? "Select a future time" : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  reminderOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  reminderLabel: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "600",
  },
  datePickerContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    padding: 16,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerClose: {
    fontSize: 20,
    fontWeight: "600",
  },
  selectedDateTime: {
    fontSize: 14,
    marginBottom: 40,
    marginTop: 18,
    textAlign: "center",
  },
  datePickerButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: "500",
    width: 40,
  },
  timeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  timeBtnText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
});
