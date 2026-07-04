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
      showToast({ message: "Failed to save link. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;
  const hasUrl = url.trim().length > 0;

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
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Save it now, nudge it later.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={[
                styles.closeButton,
                { backgroundColor: theme.surfaceElevated },
              ]}
              activeOpacity={0.6}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.textSecondary}
              />
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
                  <View
                    style={[
                      styles.labelIconContainer,
                      { backgroundColor: theme.warmPeach },
                    ]}
                  >
                    <Ionicons
                      name="link-outline"
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <Text
                    style={[styles.label, { color: theme.text }]}
                  >
                    URL
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isFocused
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="https://example.com/article"
                    placeholderTextColor={theme.tabInactive}
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
              </View>

              {isLoading && (
                <View
                  style={[
                    styles.loadingContainer,
                    {
                      backgroundColor: theme.surfaceElevated,
                    },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                  />
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

              {!isLoading && hasUrl && (
                <View
                  style={[
                    styles.urlPreview,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="link"
                    size={16}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.urlPreviewText,
                      { color: theme.text },
                    ]}
                    numberOfLines={2}
                  >
                    {url}
                  </Text>
                </View>
              )}

              <View style={styles.helperContainer}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={theme.accentPurple}
                />
                <Text
                  style={[
                    styles.helperText,
                    { color: theme.textSecondary },
                  ]}
                >
                  We'll automatically fetch the title, description
                  and preview for you.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={isLoading || !hasUrl}
                style={[
                  styles.saveButtonFull,
                  {
                    backgroundColor:
                      isLoading || !hasUrl
                        ? theme.surfaceElevated
                        : theme.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="bookmark"
                      size={20}
                      color={
                        !hasUrl
                          ? theme.tabInactive
                          : "#FFFFFF"
                      }
                    />
                    <Text
                      style={[
                        styles.saveButtonFullText,
                        {
                          color: !hasUrl
                            ? theme.tabInactive
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
    paddingTop: Platform.OS === "ios" ? 52 : 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeftSpacer: {
    width: 36,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  labelIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  urlPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  urlPreviewText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  saveButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  saveButtonFullText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
