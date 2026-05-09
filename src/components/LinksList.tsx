import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Link } from "../utils/database";
import { LinkCard } from "./LinkCard";

interface LinksListProps {
  links: Link[];
  loading: boolean;
  onLinkOpen?: (link: Link) => void;
  onMarkDone?: (link: Link) => void;
  onSnooze?: (link: Link) => void;
  onDelete?: (link: Link) => void;
  onPriorityChange?: (link: Link, priority: string) => void;
  emptyMessage?: string;
  showCompleted?: boolean;
}

export const LinksList: React.FC<LinksListProps> = ({
  links,
  loading,
  onLinkOpen,
  onMarkDone,
  onSnooze,
  onDelete,
  onPriorityChange,
  emptyMessage = "No links yet",
  showCompleted = false,
}) => {
  const { theme } = useTheme();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyEmoji, styles.centerText]}>📭</Text>
      <Text style={[styles.emptyMessage, { color: theme.text }]}>
        {emptyMessage}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {showCompleted
          ? "Once you mark links as done, they will appear here"
          : "Add your first link to get started"}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Link }) => (
    <LinkCard
      link={item}
      onOpen={() => onLinkOpen?.(item)}
      onMarkDone={() => onMarkDone?.(item)}
      onSnooze={() => onSnooze?.(item)}
      onDelete={() => onDelete?.(item)}
      onPriorityChange={(priority) => onPriorityChange?.(item, priority)}
      showCompleted={showCompleted}
    />
  );

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading links...
        </Text>
      </View>
    );
  }

  if (links.length === 0) {
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
      data={links}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={[
        styles.listContent,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  centerText: {
    textAlign: "center",
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 12,
  },
});
