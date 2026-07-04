import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "@nudge/profile";

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  createProfile: (name: string, avatarUrl?: string | null) => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "avatarUrl">>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  createProfile: async () => {},
  updateProfile: async () => {},
  deleteProfile: async () => {},
  refreshProfile: async () => {},
});

export const useProfile = (): ProfileContextType => {
  return useContext(ProfileContext);
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const json = await AsyncStorage.getItem(PROFILE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as Profile;
        if (parsed && parsed.id && parsed.name) {
          setProfile(parsed);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (data: Profile) => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    setProfile(data);
  }, []);

  const createProfile = useCallback(
    async (name: string, avatarUrl?: string | null) => {
      const now = Date.now();
      const newProfile: Profile = {
        id: `profile_${now}`,
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
    async (updates: Partial<Pick<Profile, "name" | "avatarUrl">>) => {
      if (!profile) return;

      const updated: Profile = {
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
      setProfile(null);
    } catch (error) {
      console.error("Failed to delete profile:", error);
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
