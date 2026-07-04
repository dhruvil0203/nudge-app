import React from "react";
import { View, Image, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface UserAvatarProps {
  uri: string | null | undefined;
  size?: number;
  style?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  size = 80,
  style,
  iconColor = "#D4845A",
  iconSize,
}) => {
  const iconSz = iconSize || Math.round(size * 0.4);

  if (!uri) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <Ionicons name="person" size={iconSz} color={iconColor} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5D5C8",
  },
});

export default UserAvatar;
