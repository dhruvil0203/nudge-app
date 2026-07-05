import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  Alert,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useProfile } from "../context/ProfileContext";
import { useLinks } from "../hooks/useLinks";
import { Ionicons } from "@expo/vector-icons";
import UserAvatar from "../components/UserAvatar";

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { showToast, showConfirm } = useToast();
  const insets = useSafeAreaInsets();
  const { profile, isLoading: profileLoading, createProfile, updateProfile, deleteProfile } = useProfile();
  const { pendingLinks, completedLinks } = useLinks();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []),
  );

  const safePending = Array.isArray(pendingLinks) ? pendingLinks : [];
  const safeCompleted = Array.isArray(completedLinks) ? completedLinks : [];
  const totalLinks = safePending.length + safeCompleted.length;
  const pendingCount = safePending.length;
  const completedCount = safeCompleted.length;

  const getSavedThisWeek = () => {
    const allLinks = [...safePending, ...safeCompleted];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return allLinks.filter((link) => {
      const created = new Date(link.created_at);
      return created >= startOfWeek;
    }).length;
  };

  const getCompletionRate = () => {
    if (totalLinks === 0) return 0;
    return Math.round((completedCount / totalLinks) * 100);
  };

  const handleStartEdit = () => {
    setEditName(profile?.name || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast({ message: "Name cannot be empty", type: "warning" });
      return;
    }

    try {
      setIsSaving(true);
      if (profile) {
        await updateProfile({ name: trimmedName });
      } else {
        await createProfile(trimmedName);
      }
      setIsEditing(false);
      setEditName("");
      showToast({ message: "Profile updated", type: "success" });
    } catch (error) {
      showToast({ message: "Failed to save profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = () => {
    showConfirm({
      title: "Delete Profile",
      message: "This will remove your profile permanently.\nYour saved links will not be affected.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      icon: "trash-outline",
      onConfirm: async () => {
        try {
          await deleteProfile();
          showToast({ message: "Profile deleted", type: "info" });
        } catch (error) {
          showToast({ message: "Failed to delete profile", type: "error" });
        }
      },
    });
  };

  const handleCreateFirstProfile = () => {
    setEditName("");
    setIsEditing(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow Nudge to access your photos to set a profile picture.",
        [{ text: "OK" }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      try {
        if (profile) {
          await updateProfile({ avatarUrl: uri });
          showToast({ message: "Profile photo updated", type: "success" });
        } else {
          await createProfile("Nudge User", uri);
          setIsEditing(true);
          setEditName("");
          showToast({ message: "Profile created with photo", type: "success" });
        }
      } catch (error) {
        showToast({ message: "Failed to update photo", type: "error" });
      }
    }
  };

  const handleDeleteImage = () => {
    showConfirm({
      title: "Remove Photo",
      message: "Are you sure you want to remove your profile photo?",
      confirmText: "Remove",
      cancelText: "Cancel",
      destructive: true,
      icon: "trash-outline",
      onConfirm: async () => {
        try {
          await updateProfile({ avatarUrl: null });
          setImageViewerVisible(false);
          showToast({ message: "Profile photo removed", type: "success" });
        } catch (error) {
          showToast({ message: "Failed to remove photo", type: "error" });
        }
      },
    });
  };

  if (profileLoading) {
    return (
      <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // No profile yet - show onboarding
  if (!profile && !isEditing) {
    return (
      <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={[styles.backButton, { backgroundColor: theme.surfaceElevated }]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyAvatar, { backgroundColor: theme.warmPeach }]}>
            <UserAvatar uri={null} size={100} iconColor={theme.primary} iconSize={40} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Profile Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Create a profile to personalize your Nudge experience
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.primary }]}
            onPress={handleCreateFirstProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Avatar Section */}
            <View style={[styles.avatarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity
                  style={[styles.avatarContainer, { backgroundColor: theme.warmPeach }]}
                  onPress={() => setImageViewerVisible(true)}
                  activeOpacity={0.8}
                >
                  <UserAvatar
                    uri={profile?.avatarUrl}
                    size={88}
                    iconColor={theme.primary}
                  />
                </TouchableOpacity>
                {profile?.avatarUrl && (
                  <TouchableOpacity
                    style={[styles.avatarRemoveBadge, { backgroundColor: theme.error, borderColor: theme.surface }]}
                    onPress={handleDeleteImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.avatarEditBadge, { backgroundColor: theme.primary, borderColor: theme.surface }]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={[styles.nameInput, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.surfaceElevated }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                    maxLength={30}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.editCancelButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                      onPress={handleCancelEdit}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editCancelText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editSaveButton, { backgroundColor: isSaving ? theme.tabInactive : theme.primary }]}
                      onPress={handleSaveProfile}
                      disabled={isSaving}
                      activeOpacity={0.7}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.editSaveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.profileNameSection}>
                  <Text style={[styles.profileName, { color: theme.text }]}>
                    {profile?.name || "Nudge User"}
                  </Text>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: theme.surfaceElevated }]}
                    onPress={handleStartEdit}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={14} color={theme.primary} />
                    <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.joinDate, { color: theme.textSecondary }]}>
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "just now"}
              </Text>
            </View>

            {/* Stats Section */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="bookmark" size={20} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{totalLinks}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.statValue, { color: theme.text }]}>{completedCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="time" size={20} color={theme.accentPurple} />
                <Text style={[styles.statValue, { color: theme.text }]}>{pendingCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
              </View>
            </View>

            {/* Details Section */}
            <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: theme.warmPeach }]}>
                  <Ionicons name="flame" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Saved This Week</Text>
                <Text style={[styles.detailValue, { color: theme.primary }]}>{getSavedThisWeek()}</Text>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "rgba(22, 163, 74, 0.1)" }]}>
                  <Ionicons name="trophy" size={18} color={theme.success} />
                </View>
                <Text style={[styles.detailLabel, { color: theme.text }]}>Completion Rate</Text>
                <Text style={[styles.detailValue, { color: theme.success }]}>{getCompletionRate()}%</Text>
              </View>
            </View>

            {/* Danger Zone */}
            {profile && (
              <TouchableOpacity
                style={[styles.dangerCard, { borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(220, 38, 38, 0.2)" }]}
                onPress={handleDeleteProfile}
                activeOpacity={0.7}
              >
                <View style={styles.dangerRow}>
                  <View style={[styles.dangerIconContainer, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="trash-outline" size={18} color={theme.error} />
                  </View>
                  <View style={styles.dangerTextContainer}>
                    <Text style={[styles.dangerTitle, { color: theme.error }]}>Delete Profile</Text>
                    <Text style={[styles.dangerSubtitle, { color: theme.textSecondary }]}>
                      Remove your profile permanently
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.tabInactive} />
                </View>
              </TouchableOpacity>
            )}

            {/* About Section */}
            <View style={[styles.aboutSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.aboutHeart}>🧡</Text>
              <Text style={[styles.aboutTitle, { color: theme.text }]}>About Nudge</Text>
              <Text style={[styles.aboutDescription, { color: theme.textSecondary }]}>
                A universal link saving and reminder tool.{"\n"}All data is stored locally on your device.
              </Text>
              <Text style={[styles.aboutVersion, { color: theme.primary }]}>Version 1.0.0</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full-screen Image Viewer */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <StatusBar hidden />
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setImageViewerVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <UserAvatar
            uri={profile?.avatarUrl}
            size={300}
            iconColor="#FFFFFF"
            iconSize={80}
          />
          {profile?.avatarUrl && (
            <TouchableOpacity
              style={styles.imageViewerDelete}
              onPress={handleDeleteImage}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.imageViewerDeleteText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Avatar card
  avatarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
    width: 88,
    height: 88,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarRemoveBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileNameSection: {
    alignItems: "center",
    gap: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  joinDate: {
    fontSize: 12,
    marginTop: 8,
  },
  // Edit mode
  editNameContainer: {
    width: "100%",
    gap: 12,
  },
  nameInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editSaveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Details
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  detailDivider: {
    height: 1,
    marginVertical: 4,
  },
  // Danger zone
  dangerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dangerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dangerTextContainer: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  dangerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // About
  aboutSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  aboutHeart: {
    fontSize: 28,
    marginBottom: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  aboutVersion: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  // Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  imageViewerDelete: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 56 : 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "rgba(239, 68, 68, 0.85)",
  },
  imageViewerDeleteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ProfileScreen;
