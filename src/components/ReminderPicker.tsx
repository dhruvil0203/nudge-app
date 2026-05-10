import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Animated,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { REMINDER_LABELS, REMINDER_OPTIONS, REMINDER_ICONS } from "../constants";

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
  const { showToast } = useToast();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const reminders = [
    REMINDER_OPTIONS.NO_REMINDER,
    REMINDER_OPTIONS.IN_1_MINUTE,
    REMINDER_OPTIONS.IN_1_HOUR,
    REMINDER_OPTIONS.TONIGHT,
    REMINDER_OPTIONS.TOMORROW,
    REMINDER_OPTIONS.CUSTOM,
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible]);

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
      showToast({
        message: "Please select a time at least 1 minute in the future.",
        type: "warning",
        icon: "⏰",
      });
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

  const getReminderDescription = (reminder: string): string => {
    switch (reminder) {
      case REMINDER_OPTIONS.NO_REMINDER:
        return "No notification will be sent";
      case REMINDER_OPTIONS.IN_1_MINUTE:
        return "Quick test reminder";
      case REMINDER_OPTIONS.IN_1_HOUR:
        return "Get reminded in 60 minutes";
      case REMINDER_OPTIONS.TONIGHT:
        return "We'll nudge you at 8:00 PM";
      case REMINDER_OPTIONS.TOMORROW:
        return "Start your day with this link";
      case REMINDER_OPTIONS.CUSTOM:
        return "Pick your own date & time";
      default:
        return "";
    }
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
            <Text style={styles.titleIcon}>⏰</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Set Reminder
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButtonWrapper,
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
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {reminders.map((reminder, index) => {
              const isSelected = selectedReminder === reminder;
              const icon =
                REMINDER_ICONS[reminder as keyof typeof REMINDER_ICONS] || "⏰";

              return (
                <TouchableOpacity
                  key={reminder}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(129, 140, 248, 0.15)'
                          : 'rgba(99, 102, 241, 0.08)'
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectReminder(reminder)}
                  activeOpacity={0.6}
                >
                  <View style={styles.reminderLeft}>
                    <View
                      style={[
                        styles.reminderIconContainer,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surfaceElevated,
                        },
                      ]}
                    >
                      <Text style={[styles.reminderIcon, { color: '#FFFFFF' }]}>{icon}</Text>
                    </View>
                    <View style={styles.reminderTextContainer}>
                      <Text
                        style={[
                          styles.reminderLabel,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {REMINDER_LABELS[
                          reminder as keyof typeof REMINDER_LABELS
                        ]}
                      </Text>
                      <Text
                        style={[
                          styles.reminderDescription,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {getReminderDescription(reminder)}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.checkmarkContainer,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {showDatePicker && (
              <View
                style={[
                  styles.datePickerContainer,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.datePickerHeader}>
                  <View style={styles.datePickerTitleRow}>
                    <Text style={styles.datePickerTitleIcon}>📅</Text>
                    <Text
                      style={[styles.datePickerTitle, { color: theme.text }]}
                    >
                      Select Date & Time
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={[
                      styles.datePickerCloseBtn,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePickerClose,
                        { color: theme.textSecondary },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.selectedDateContainer,
                    {
                      backgroundColor: isInPast
                        ? 'rgba(239, 68, 68, 0.1)'
                        : theme.surfaceElevated,
                      borderColor: isInPast ? theme.error : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedDateTime,
                      {
                        color: isInPast ? theme.error : theme.text,
                      },
                    ]}
                  >
                    {selectedDate.toLocaleString()}
                  </Text>
                  {isInPast && (
                    <Text
                      style={[styles.pastWarning, { color: theme.error }]}
                    >
                      ⚠️ Select a future time
                    </Text>
                  )}
                </View>

                {(["day", "hour", "minute"] as const).map((unit) => (
                  <View style={styles.timeRow} key={unit}>
                    <Text style={[styles.timeLabel, { color: theme.text }]}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                    <View style={styles.timeControls}>
                      <TouchableOpacity
                        style={[
                          styles.timeBtn,
                          {
                            backgroundColor: wouldGoPast(unit)
                              ? theme.surfaceElevated
                              : theme.primary,
                          },
                        ]}
                        onPress={() => adjustDate(unit, -1)}
                        disabled={wouldGoPast(unit)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.timeBtnText,
                            {
                              color: wouldGoPast(unit)
                                ? theme.textSecondary
                                : "#FFFFFF",
                            },
                          ]}
                        >
                          −
                        </Text>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.timeValueContainer,
                          { backgroundColor: theme.surfaceElevated },
                        ]}
                      >
                        <Text
                          style={[styles.timeValue, { color: theme.text }]}
                        >
                          {unit === "day"
                            ? selectedDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : unit === "hour"
                              ? selectedDate
                                  .getHours()
                                  .toString()
                                  .padStart(2, "0")
                              : selectedDate
                                  .getMinutes()
                                  .toString()
                                  .padStart(2, "0")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.timeBtn,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => adjustDate(unit, 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeBtnText, { color: "#FFFFFF" }]}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: isInPast
                        ? theme.surfaceElevated
                        : theme.primary,
                    },
                  ]}
                  onPress={handleDateConfirm}
                  disabled={isInPast}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      {
                        color: isInPast ? theme.textSecondary : "#FFFFFF",
                      },
                    ]}
                  >
                    {isInPast ? "Select a future time" : "✓  Confirm Reminder"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
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
  closeButtonWrapper: {
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
  reminderOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 14,
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderIcon: {
    fontSize: 18,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  datePickerContainer: {
    marginTop: 8,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerTitleIcon: {
    fontSize: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  datePickerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerClose: {
    fontSize: 14,
    fontWeight: "700",
  },
  selectedDateContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  selectedDateTime: {
    fontSize: 15,
    fontWeight: "600",
  },
  pastWarning: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 55,
    textTransform: "capitalize",
  },
  timeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  timeBtnText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  timeValueContainer: {
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  datePickerButton: {
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  datePickerButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
