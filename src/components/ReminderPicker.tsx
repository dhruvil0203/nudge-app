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
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { REMINDER_LABELS, REMINDER_OPTIONS } from "../constants";
import { Ionicons } from "@expo/vector-icons";

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
      setShowDatePicker(false);
      setSelectedDate(new Date());
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

  const getReminderIcon = (reminder: string): { name: string; color: string; bg: string } => {
    switch (reminder) {
      case REMINDER_OPTIONS.NO_REMINDER:
        return { name: "close-circle", color: theme.tabInactive, bg: theme.surfaceElevated };
      case REMINDER_OPTIONS.IN_1_MINUTE:
        return { name: "time", color: theme.primary, bg: theme.warmPeach };
      case REMINDER_OPTIONS.IN_1_HOUR:
        return { name: "time", color: theme.accentPurple, bg: isDark ? "rgba(168, 141, 170, 0.15)" : "rgba(139, 107, 141, 0.1)" };
      case REMINDER_OPTIONS.TONIGHT:
        return { name: "moon", color: theme.accentTeal, bg: isDark ? "rgba(20, 184, 166, 0.15)" : "rgba(13, 148, 136, 0.1)" };
      case REMINDER_OPTIONS.TOMORROW:
        return { name: "sunny", color: theme.primary, bg: theme.warmPeach };
      case REMINDER_OPTIONS.CUSTOM:
        return { name: "calendar", color: theme.warmTerracotta, bg: theme.warmPeach };
      default:
        return { name: "alarm", color: theme.primary, bg: theme.warmPeach };
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
            <View style={[styles.headerIconContainer, { backgroundColor: theme.warmPeach }]}>
              <Ionicons name="alarm-outline" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                Set Reminder
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                When should we nudge you?
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButtonWrapper,
              { backgroundColor: theme.surfaceElevated },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={theme.textSecondary} />
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
            {reminders.map((reminder) => {
              const isSelected = selectedReminder === reminder;
              const iconConfig = getReminderIcon(reminder);

              return (
                <TouchableOpacity
                  key={reminder}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: isSelected
                        ? theme.warmPeach
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
                        { backgroundColor: iconConfig.bg },
                      ]}
                    >
                      <Ionicons
                        name={iconConfig.name as any}
                        size={20}
                        color={iconConfig.color}
                      />
                    </View>
                    <View style={styles.reminderTextContainer}>
                      <Text
                        style={[
                          styles.reminderLabel,
                          {
                            color: theme.text,
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
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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
                    <View style={[styles.datePickerIconContainer, { backgroundColor: theme.warmPeach }]}>
                      <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    </View>
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
                    <Ionicons name="close" size={16} color={theme.textSecondary} />
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
                      Select a future time
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
                        <Ionicons
                          name="remove"
                          size={18}
                          color={wouldGoPast(unit) ? theme.textSecondary : "#FFFFFF"}
                        />
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
                        <Ionicons name="add" size={18} color="#FFFFFF" />
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
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={isInPast ? theme.textSecondary : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      {
                        color: isInPast ? theme.textSecondary : "#FFFFFF",
                      },
                    ]}
                  >
                    {isInPast ? "Select a future time" : "Confirm Reminder"}
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
    paddingTop: Platform.OS === "ios" ? 48 : 44,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButtonWrapper: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
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
  datePickerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  datePickerButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
