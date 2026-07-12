import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import type { Link } from "../types";
import { LinkCard } from "./LinkCard";
import { Ionicons } from "@expo/vector-icons";

interface LinksListProps {
  links: Link[];
  loading: boolean;
  onLinkOpen?: (link: Link) => void;
  onMarkDone?: (link: Link) => void;
  onSnooze?: (link: Link) => void;
  onDelete?: (link: Link) => void;
  emptyMessage?: string;
  showCompleted?: boolean;
}

const MemoizedLinkCard = memo(LinkCard);

export const LinksList: React.FC<LinksListProps> = ({
  links,
  loading,
  onLinkOpen,
  onMarkDone,
  onSnooze,
  onDelete,
  emptyMessage = "No links yet",
  showCompleted = false,
}) => {
  const { theme } = useTheme();

  const safeLinks = Array.isArray(links) ? links : [];

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.warmPeach }]}>
        <Ionicons
          name={showCompleted ? "checkmark-done-outline" : "bookmark-outline"}
          size={40}
          color={theme.primary}
        />
      </View>
      <Text style={[styles.emptyMessage, { color: theme.text }]}>
        {emptyMessage}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {showCompleted
          ? "Once you mark links as done, they'll show up here"
          : "Tap the + button to save your first link"}
      </Text>
    </View>
  ), [theme, showCompleted, emptyMessage]);

  const renderLoading = useCallback(() => (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        Loading your links...
      </Text>
    </View>
  ), [theme]);

  const renderItem = useCallback(({ item }: { item: Link }) => {
    if (!item || !item.id) return null;
    return (
      <MemoizedLinkCard
        link={item}
        onOpen={() => onLinkOpen?.(item)}
        onMarkDone={() => onMarkDone?.(item)}
        onSnooze={() => onSnooze?.(item)}
        onDelete={() => onDelete?.(item)}
        showCompleted={showCompleted}
      />
    );
  }, [onLinkOpen, onMarkDone, onSnooze, onDelete, showCompleted]);

  const keyExtractor = useCallback((item: Link) => {
    if (!item || !item.id) return String(Math.random());
    return String(item.id);
  }, []);

  if (loading) {
    return renderLoading();
  }

  if (safeLinks.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainerFlex,
          { backgroundColor: theme.background },
        ]}
      >
        {renderEmpty()}
      </View>
    );
  }

  return (
    <FlatList
      data={safeLinks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContent,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
      maxToRenderPerBatch={10}
      windowSize={7}
      initialNumToRender={8}
      removeClippedSubviews={true}
      accessibilityLabel="Links list"
      accessibilityRole="list"
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainerFlex: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
});
