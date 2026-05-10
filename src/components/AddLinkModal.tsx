import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { Ionicons } from "@expo/vector-icons";

interface AddLinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<void>;
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
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [url, setUrl] = useState(defaultUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setUrl(defaultUrl);
  }, [defaultUrl]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
      slideAnim.setValue(30);
    }
  }, [visible]);

  const handleAdd = async () => {
    if (!url.trim()) {
      showToast({ message: "Please enter a URL", type: "warning" });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd(url);
      setUrl("");
      onClose();
    } catch (error) {
      console.error("Error adding link:", error);
      showToast({ message: "Failed to add link", type: "error" });
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.headerContainer,
              {
                backgroundColor: theme.surface,
                borderBottomColor: theme.border,
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.headerLeftSpacer} />
            
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]}>
                Add New Link
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={styles.headerCloseButton}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Ionicons name="globe-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    URL
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isFocused ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Paste your link here..."
                    placeholderTextColor={theme.textSecondary}
                    value={url}
                    onChangeText={setUrl}
                    editable={!isLoading}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
                <Text
                  style={[styles.helperText, { color: theme.textSecondary }]}
                >
                  Title, description & preview will be fetched automatically
                </Text>
              </View>

              {isLoading && (
                <View
                  style={[
                    styles.loadingContainer,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Fetching link details...
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleAdd}
                disabled={isLoading || !url.trim()}
                style={[
                  styles.saveButtonFull,
                  {
                    backgroundColor: isLoading || !url.trim()
                      ? theme.surfaceElevated
                      : theme.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons 
                      name="bookmark" 
                      size={20} 
                      color={!url.trim() ? theme.textSecondary : "#FFFFFF"} 
                    />
                    <Text
                      style={[
                        styles.saveButtonFullText,
                        {
                          color: !url.trim()
                            ? theme.textSecondary
                            : "#FFFFFF",
                        },
                      ]}
                    >
                      Save Link
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeftSpacer: {
    width: 40,
  },
  headerCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  labelIcon: {
    fontSize: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 90,
    lineHeight: 22,
  },
  helperText: {
    fontSize: 13,
    marginTop: 10,
    marginLeft: 4,
    lineHeight: 18,
  },
  saveButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  saveButtonFullText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
