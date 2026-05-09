import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Link } from "../utils/database";
import { EMPTY_IMAGE, PRIORITY_COLORS, REMINDER_LABELS } from "../constants";

interface LinkCardProps {
  link: Link;
  onMarkDone?: () => void;
  onSnooze?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
  onPriorityChange?: (priority: string) => void;
  showCompleted?: boolean;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onMarkDone,
  onSnooze,
  onOpen,
  onDelete,
  onPriorityChange,
  showCompleted = false,
}) => {
  const { theme } = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleOpenLink = async () => {
    try {
      const canOpen = await Linking.canOpenURL(link.url);
      if (canOpen) {
        await Linking.openURL(link.url);
        onOpen?.();
      } else {
        Alert.alert("Cannot open link", "Unable to open this URL");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open link");
      console.error("Error opening link:", error);
    }
  };

  const imageSource = imageError || !link.image ? EMPTY_IMAGE : link.image;

  const createdDate = new Date(link.created_at);
  const dateString = createdDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const priorityColor =
    PRIORITY_COLORS[link.priority as keyof typeof PRIORITY_COLORS] ||
    PRIORITY_COLORS.normal;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      {/* Header with Priority and Date */}
      <View style={styles.header}>
        <View
          style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
        >
          <Text style={styles.priorityText}>
            {link.priority.toUpperCase()[0]}
          </Text>
        </View>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {dateString}
        </Text>
      </View>

      {/* Image */}
      <View style={[styles.imageContainer, { backgroundColor: theme.surface }]}>
        {imageLoading && (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={styles.loader}
          />
        )}
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {link.title && (
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {link.title}
          </Text>
        )}
        {link.description && (
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {link.description}
          </Text>
        )}
        {link.domain && (
          <Text
            style={[styles.domain, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {link.domain}
          </Text>
        )}
      </View>

      {/* Reminder Info */}
      {link.reminder_type !== "no_reminder" && (
        <View style={styles.reminderInfo}>
          <Text
            style={[styles.reminderText, { color: theme.primary }]}
            numberOfLines={1}
          >
            ⏰{" "}
            {REMINDER_LABELS[
              link.reminder_type as keyof typeof REMINDER_LABELS
            ] || "Reminder set"}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleOpenLink}
        >
          <Text style={styles.actionButtonText}>Open</Text>
        </TouchableOpacity>

        {!showCompleted && onMarkDone && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.success }]}
            onPress={onMarkDone}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        )}

        {!showCompleted && onSnooze && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.warning }]}
            onPress={onSnooze}
          >
            <Text style={styles.actionButtonText}>Snooze</Text>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            onPress={onDelete}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
  imageContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    position: "absolute",
    zIndex: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  domain: {
    fontSize: 12,
    fontWeight: "500",
  },
  reminderInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
});
