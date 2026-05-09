import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { PRIORITY_LEVELS } from "../constants";

interface AddLinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string, priority: string) => Promise<void>;
  defaultUrl?: string;
  loading?: boolean;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({
  visible,
  onClose,
  onAdd,
  defaultUrl = "",
  loading = false,
}) => {
  const { theme } = useTheme();
  const [url, setUrl] = useState(defaultUrl);
  const [priority, setPriority] = useState(PRIORITY_LEVELS.NORMAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUrl(defaultUrl);
  }, [defaultUrl]);

  const handleAdd = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd(url, priority);
      setUrl("");
      setPriority(PRIORITY_LEVELS.NORMAL);
      onClose();
    } catch (error) {
      console.error("Error adding link:", error);
      Alert.alert("Error", "Failed to add link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Text
              style={[
                styles.cancelButton,
                { color: isLoading ? theme.textSecondary : theme.primary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Add Link</Text>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={isLoading}
            style={styles.addButtonWrapper}
          >
            <Text
              style={[
                styles.addButton,
                { color: isLoading ? theme.textSecondary : theme.primary },
              ]}
            >
              {isLoading ? "Adding..." : "Add"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>URL</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="https://example.com"
              placeholderTextColor={theme.textSecondary}
              value={url}
              onChangeText={setUrl}
              editable={!isLoading}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
            <View style={styles.priorityOptions}>
              {Object.values(PRIORITY_LEVELS).map((prio) => (
                <TouchableOpacity
                  key={prio}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor:
                        priority === prio ? theme.primary : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setPriority(prio)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      {
                        color: priority === prio ? "#FFFFFF" : theme.text,
                      },
                    ]}
                  >
                    {prio.charAt(0).toUpperCase() + prio.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Fetching link details...
              </Text>
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
  cancelButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButtonWrapper: {
    minWidth: 50,
    alignItems: "flex-end",
  },
  addButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  priorityButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
