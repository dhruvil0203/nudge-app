import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProfileData } from "../types";

const PROFILE_KEY = "@nudge/profile";

interface ProfileContextType {
  profile: ProfileData | null;
  isLoading: boolean;
  createProfile: (name: string, avatarUrl?: string | null) => Promise<void>;
  updateProfile: (updates: Partial<Pick<ProfileData, "name" | "avatarUrl">>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

function validateProfileData(data: unknown): data is ProfileData {
  if (!data || typeof data !== "object") return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    (p.avatarUrl === null || typeof p.avatarUrl === "string") &&
    typeof p.createdAt === "number" &&
    typeof p.updatedAt === "number"
  );
}

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const json = await AsyncStorage.getItem(PROFILE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        if (validateProfileData(parsed)) {
          if (mountedRef.current) {
            setProfile(parsed);
          }
        } else {
          if (mountedRef.current) {
            setProfile(null);
          }
        }
      } else {
        if (mountedRef.current) {
          setProfile(null);
        }
      }
    } catch (error) {
      console.error("[Profile] Failed to load profile:", error);
      if (mountedRef.current) {
        setProfile(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (data: ProfileData) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    if (mountedRef.current) {
      setProfile(data);
    }
  }, []);

  const createProfile = useCallback(
    async (name: string, avatarUrl?: string | null) => {
      const now = Date.now();
      const newProfile: ProfileData = {
        id: `profile_${now}_${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim() || "Nudge User",
        avatarUrl: avatarUrl || null,
        createdAt: now,
        updatedAt: now,
      };
      await saveProfile(newProfile);
    },
    [saveProfile],
  );

  const updateProfile = useCallback(
    async (updates: Partial<Pick<ProfileData, "name" | "avatarUrl">>) => {
      if (!profile) return;

      const updated: ProfileData = {
        ...profile,
        name: updates.name !== undefined ? updates.name.trim() || profile.name : profile.name,
        avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : profile.avatarUrl,
        updatedAt: Date.now(),
      };
      await saveProfile(updated);
    },
    [profile, saveProfile],
  );

  const deleteProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
      if (mountedRef.current) {
        setProfile(null);
      }
    } catch (error) {
      console.error("[Profile] Failed to delete profile:", error);
      throw error;
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        createProfile,
        updateProfile,
        deleteProfile,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
