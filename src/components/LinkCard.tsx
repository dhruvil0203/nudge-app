import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Platform,
  Animated,
  Pressable,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { Link } from "../utils/database";
import {
  EMPTY_IMAGE,
  REMINDER_LABELS,
} from "../constants";

interface LinkCardProps {
  link: Link;
  onMarkDone?: () => void;
  onSnooze?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
  showCompleted?: boolean;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onMarkDone,
  onSnooze,
  onOpen,
  onDelete,
  showCompleted = false,
}) => {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const cardScale = useRef(new Animated.Value(1)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;
  const doneScale = useRef(new Animated.Value(1)).current;
  const snoozeScale = useRef(new Animated.Value(1)).current;
  const openScale = useRef(new Animated.Value(1)).current;

  const animatePress = (anim: Animated.Value, onComplete?: () => void) => {
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 0.92,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete?.());
  };

  const handleOpenLink = async () => {
    animatePress(openScale);
    try {
      let urlToOpen = link.url;
      if (!urlToOpen.match(/^https?:\/\//i)) {
        urlToOpen = `https://${urlToOpen}`;
      }
      await Linking.openURL(urlToOpen);
      onOpen?.();
    } catch (error) {
      showToast({ message: "Unable to open this URL", type: "error", icon: "🔗" });
      console.error("Error opening link:", error);
    }
  };

  const handleCardPress = () => {
    Animated.sequence([
      Animated.spring(cardScale, {
        toValue: 0.97,
        tension: 300,
        friction: 15,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 300,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();
    handleOpenLink();
  };

  const imageSource = imageError || !link.image ? EMPTY_IMAGE : link.image;

  const createdDate = new Date(link.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo = "";
  if (diffMins < 1) timeAgo = "Just now";
  else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
  else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
  else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
  else {
    timeAgo = createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <Pressable
        onPress={handleCardPress}
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            ...Platform.select({
              ios: {
                shadowColor: isDark ? "#000" : "#6366F1",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.35 : 0.1,
                shadowRadius: 16,
              },
              android: {
                elevation: isDark ? 6 : 4,
              },
            }),
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {timeAgo}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {link.reminder_type !== "no_reminder" && (
              <View
                style={[
                  styles.reminderBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(129, 140, 248, 0.15)"
                      : "rgba(99, 102, 241, 0.1)",
                    borderColor: isDark
                      ? "rgba(129, 140, 248, 0.25)"
                      : "rgba(99, 102, 241, 0.15)",
                  },
                ]}
              >
                <Text style={[styles.reminderBadgeText, { color: theme.primary }]}>
                  ⏰{" "}
                  {REMINDER_LABELS[
                    link.reminder_type as keyof typeof REMINDER_LABELS
                  ] || "Reminder"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[styles.imageContainer, { backgroundColor: theme.surfaceElevated }]}
        >
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
          <View style={styles.imageOverlay} />
          {link.domain && (
            <View
              style={[
                styles.domainChip,
                {
                  backgroundColor: isDark
                    ? "rgba(0, 0, 0, 0.7)"
                    : "rgba(0, 0, 0, 0.55)",
                },
              ]}
            >
              <View style={[styles.domainDot, { backgroundColor: theme.primary }]} />
              <Text style={styles.domainChipText} numberOfLines={1}>
                {link.domain}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {link.title && (
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={2}
            >
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
        </View>

        <View
          style={[
            styles.actions,
            { borderTopColor: theme.border },
          ]}
        >
          <Animated.View style={[styles.actionFlex, { transform: [{ scale: openScale }] }]}>
            <TouchableOpacity
              style={[
                styles.actionButtonPrimary,
                {
                  backgroundColor: theme.primary,
                  ...Platform.select({
                    ios: {
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    },
                    android: { elevation: 2 },
                  }),
                },
              ]}
              onPress={handleOpenLink}
              activeOpacity={0.8}
            >
              <Text style={styles.actionEmoji}>🔗</Text>
              <Text style={styles.actionButtonPrimaryText}>Open</Text>
            </TouchableOpacity>
          </Animated.View>

          {!showCompleted && onMarkDone && (
            <Animated.View style={[styles.actionFlex, { transform: [{ scale: doneScale }] }]}>
              <TouchableOpacity
                style={[
                  styles.actionButtonPrimary,
                  {
                    backgroundColor: theme.success,
                    ...Platform.select({
                      ios: {
                        shadowColor: theme.success,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      },
                      android: { elevation: 2 },
                    }),
                  },
                ]}
                onPress={() => animatePress(doneScale, onMarkDone)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>✓</Text>
                <Text style={styles.actionButtonPrimaryText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!showCompleted && onSnooze && (
            <Animated.View style={{ transform: [{ scale: snoozeScale }] }}>
              <TouchableOpacity
                style={[
                  styles.actionButtonCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(251, 191, 36, 0.15)"
                      : "rgba(245, 158, 11, 0.12)",
                    borderColor: isDark
                      ? "rgba(251, 191, 36, 0.3)"
                      : "rgba(245, 158, 11, 0.2)",
                  },
                ]}
                onPress={() => animatePress(snoozeScale, onSnooze)}
                activeOpacity={0.7}
              >
                <Text style={styles.circleEmoji}>⏰</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {onDelete && (
            <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 116, 139, 0.25)"
                      : "rgba(100, 116, 139, 0.12)",
                    borderColor: isDark
                      ? "#64748B"
                      : "#64748B",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#64748B",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isDark ? 0.7 : 0.35,
                        shadowRadius: 10,
                      },
                      android: {
                        elevation: 4,
                      },
                    }),
                  },
                ]}
                onPress={() => animatePress(deleteScale, onDelete)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 18,
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityIcon: {
    fontSize: 16,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.1,
  },
  reminderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  imageContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "transparent",
  },
  domainChip: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  domainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    maxWidth: 180,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    alignItems: "center",
  },
  actionFlex: {
    flex: 1,
  },
  actionButtonPrimary: {
    flexDirection: "row",
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  actionEmoji: {
    fontSize: 13,
  },
  actionButtonPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  actionButtonCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  circleEmoji: {
    fontSize: 17,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  deleteIcon: {
    fontSize: 19,
  },
});
