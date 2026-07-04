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
import { EMPTY_IMAGE } from "../constants";
import { Ionicons } from "@expo/vector-icons";

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

  if (!link || !link.id) return null;

  const animatePress = (
    anim: Animated.Value,
    onComplete?: () => void,
  ) => {
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
      let urlToOpen = link.url || "";
      if (!urlToOpen.match(/^https?:\/\//i)) {
        urlToOpen = `https://${urlToOpen}`;
      }
      await Linking.openURL(urlToOpen);
      onOpen?.();
    } catch (error) {
      showToast({
        message: "Unable to open this URL",
        type: "error",
      });
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

  const imageSource =
    imageError || !link.image ? EMPTY_IMAGE : link.image;

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

  const getDomainIcon = (domain: string) => {
    if (domain?.includes("youtube")) return "logo-youtube";
    if (domain?.includes("x.com") || domain?.includes("twitter"))
      return "logo-twitter";
    if (domain?.includes("instagram")) return "logo-instagram";
    if (domain?.includes("github")) return "logo-github";
    return "globe-outline";
  };

  const getDomainColor = (domain: string) => {
    if (domain?.includes("youtube")) return "#FF0000";
    if (domain?.includes("x.com") || domain?.includes("twitter"))
      return "#1DA1F2";
    if (domain?.includes("instagram")) return "#E4405F";
    return theme.primary;
  };

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
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: isDark ? 4 : 2,
              },
            }),
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: theme.surfaceElevated },
            ]}
          >
            {imageLoading && (
              <ActivityIndicator
                size="small"
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

          <View style={styles.textContent}>
            <View style={styles.header}>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {timeAgo}
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={theme.tabInactive}
                />
              </TouchableOpacity>
            </View>

            {link.title ? (
              <Text
                style={[styles.title, { color: theme.text }]}
                numberOfLines={2}
              >
                {link.title}
              </Text>
            ) : (
              <Text
                style={[styles.title, { color: theme.text }]}
                numberOfLines={2}
              >
                {link.url}
              </Text>
            )}

            {link.title && (
              <Text
                style={[styles.url, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {link.url}
              </Text>
            )}

            {link.domain && (
              <View style={styles.domainRow}>
                <Ionicons
                  name={getDomainIcon(link.domain) as any}
                  size={12}
                  color={getDomainColor(link.domain)}
                />
                <Text
                  style={[
                    styles.domain,
                    { color: theme.textSecondary },
                  ]}
                >
                  {link.domain}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.actions,
            { borderTopColor: theme.border },
          ]}
        >
          {!showCompleted && (
            <>
              <Animated.View
                style={[
                  styles.actionFlex,
                  { transform: [{ scale: openScale }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.surfaceElevated },
                  ]}
                  onPress={handleOpenLink}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Open
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {onMarkDone && (
                <Animated.View
                  style={[
                    styles.actionFlex,
                    { transform: [{ scale: doneScale }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.success },
                    ]}
                    onPress={() => animatePress(doneScale, onMarkDone)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={[styles.actionText, { color: "#FFFFFF" }]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {onSnooze && (
                <Animated.View
                  style={[
                    styles.actionFlex,
                    { transform: [{ scale: snoozeScale }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.warmPeach },
                    ]}
                    onPress={() => animatePress(snoozeScale, onSnooze)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={16}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {onDelete && (
                <Animated.View
                  style={{
                    transform: [{ scale: deleteScale }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      {
                        backgroundColor: isDark
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(239, 68, 68, 0.06)",
                      },
                    ]}
                    onPress={() => animatePress(deleteScale, onDelete)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.error}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </>
          )}

          {showCompleted && (
            <View style={styles.completedActions}>
              <TouchableOpacity
                style={[
                  styles.openButton,
                  { backgroundColor: theme.surfaceElevated },
                ]}
                onPress={handleOpenLink}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="open-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.openButtonText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Open
                </Text>
              </TouchableOpacity>
              {onDelete && (
                <TouchableOpacity
                  style={[
                    styles.deleteIconButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(239, 68, 68, 0.06)",
                    },
                  ]}
                  onPress={() => animatePress(deleteScale, onDelete)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={theme.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
  textContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 11,
    fontWeight: "500",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  url: {
    fontSize: 11,
    marginTop: 2,
  },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  domain: {
    fontSize: 11,
    fontWeight: "500",
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
  actionButton: {
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  completedActions: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  openButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  openButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
