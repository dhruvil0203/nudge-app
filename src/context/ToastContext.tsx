import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useTheme } from "./ThemeContext";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: string;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  showConfirm: (config: ConfirmConfig) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  warning: "warning",
  info: "information-circle",
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme, isDark } = useTheme();

  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  const toastAnim = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const confirmAnim = useRef(new Animated.Value(0)).current;
  const confirmScale = useRef(new Animated.Value(0.85)).current;

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [toastAnim, toastOpacity]);

  const showToast = useCallback(
    (config: ToastConfig) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setToast(config);

      toastAnim.setValue(-100);
      toastOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(toastAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = config.duration || 2800;
      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [toastAnim, toastOpacity, hideToast],
  );

  const showConfirm = useCallback(
    (config: ConfirmConfig) => {
      setConfirm(config);
      confirmAnim.setValue(0);
      confirmScale.setValue(0.85);

      Animated.parallel([
        Animated.timing(confirmAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(confirmScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [confirmAnim, confirmScale],
  );

  const hideConfirm = useCallback(() => {
    Animated.parallel([
      Animated.timing(confirmAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(confirmScale, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setConfirm(null);
    });
  }, [confirmAnim, confirmScale]);

  const handleConfirm = useCallback(() => {
    if (confirm?.onConfirm) {
      confirm.onConfirm();
    }
    hideConfirm();
  }, [confirm, hideConfirm]);

  const handleCancel = useCallback(() => {
    if (confirm?.onCancel) {
      confirm.onCancel();
    }
    hideConfirm();
  }, [confirm, hideConfirm]);

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
          border: isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.25)",
          text: isDark ? "#34D399" : "#059669",
        };
      case "error":
        return {
          bg: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
          border: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.25)",
          text: isDark ? "#F87171" : "#DC2626",
        };
      case "warning":
        return {
          bg: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
          border: isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.25)",
          text: isDark ? "#FBBF24" : "#D97706",
        };
      case "info":
        return {
          bg: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
          border: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.25)",
          text: isDark ? "#A5B4FC" : "#4F46E5",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notification */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
              opacity: toastOpacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            style={[
              styles.toast,
              {
                backgroundColor: getToastColors(toast.type || "info").bg,
                borderColor: getToastColors(toast.type || "info").border,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.4 : 0.15,
                    shadowRadius: 16,
                  },
                  android: {
                    elevation: 12,
                    backgroundColor: isDark
                      ? theme.surface
                      : "#FFFFFF",
                  },
                }),
              },
            ]}
          >
            <View
              style={[
                styles.toastIconContainer,
                {
                  backgroundColor: getToastColors(toast.type || "info").bg,
                },
              ]}
            >
              <Ionicons 
                name={(toast.icon as any) || TOAST_ICONS[toast.type || "info"]} 
                size={22} 
                color={getToastColors(toast.type || "info").text} 
              />
            </View>
            <View style={styles.toastContent}>
              <Text
                style={[
                  styles.toastMessage,
                  {
                    color: Platform.OS === "android" && !isDark
                      ? theme.text
                      : getToastColors(toast.type || "info").text,
                  },
                ]}
                numberOfLines={2}
              >
                {toast.message}
              </Text>
            </View>
            <View
              style={[
                styles.toastAccent,
                {
                  backgroundColor: getToastColors(toast.type || "info").text,
                },
              ]}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Confirm Dialog */}
      {confirm && (
        <Animated.View
          style={[
            styles.confirmOverlay,
            {
              opacity: confirmAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.confirmBackdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <Animated.View
            style={[
              styles.confirmDialog,
              {
                backgroundColor: theme.surface,
                borderColor: confirm.destructive
                  ? isDark
                    ? "rgba(100, 116, 139, 0.4)"
                    : "rgba(100, 116, 139, 0.2)"
                  : theme.border,
                transform: [{ scale: confirmScale }],
                ...Platform.select({
                  ios: {
                    shadowColor: confirm.destructive ? "#64748B" : "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: isDark ? 0.5 : 0.2,
                    shadowRadius: 24,
                  },
                  android: {
                    elevation: 20,
                  },
                }),
              },
            ]}
          >
            {confirm.icon && (
              <View
                style={[
                  styles.confirmIconContainer,
                  {
                    backgroundColor: confirm.destructive
                      ? isDark
                        ? "rgba(100, 116, 139, 0.2)"
                        : "rgba(100, 116, 139, 0.1)"
                      : isDark
                        ? "rgba(129, 140, 248, 0.15)"
                        : "rgba(99, 102, 241, 0.1)",
                    borderWidth: confirm.destructive ? 1.5 : 0,
                    borderColor: confirm.destructive
                      ? isDark
                        ? "#64748B"
                        : "rgba(100, 116, 139, 0.4)"
                      : "transparent",
                  },
                ]}
              >
                <Ionicons 
                  name={(confirm.icon as any) || "help-circle-outline"} 
                  size={28} 
                  color={confirm.destructive ? (isDark ? "#94A3B8" : "#64748B") : theme.primary} 
                />
              </View>
            )}

            <Text style={[styles.confirmTitle, { color: confirm.destructive ? (isDark ? '#94A3B8' : '#64748B') : theme.text }]}>
              {confirm.title}
            </Text>

            <Text
              style={[
                styles.confirmMessage,
                { color: theme.textSecondary },
              ]}
            >
              {confirm.message}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmCancelButton,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: theme.text },
                  ]}
                >
                  {confirm.cancelText || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmActionButton,
                  {
                    backgroundColor: confirm.destructive
                      ? "#64748B"
                      : theme.primary,
                  },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: "#FFFFFF" },
                  ]}
                >
                  {confirm.confirmText || "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
    overflow: "hidden",
  },
  toastIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toastIcon: {
    fontSize: 18,
  },
  toastContent: {
    flex: 1,
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  toastAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
    paddingHorizontal: 32,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  confirmDialog: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  confirmIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmIcon: {
    fontSize: 26,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelButton: {
    borderWidth: 1,
  },
  confirmActionButton: {},
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
