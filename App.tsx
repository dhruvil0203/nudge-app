import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Alert, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { initDatabase } from "./src/utils/database";
import {
  initializeNotifications,
  setupNotificationListeners,
} from "./src/utils/notifications";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { useShareSheet } from "./src/utils/shareSheet";

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const [dbReady, setDbReady] = useState(false);
  const { theme, isDark } = useTheme();
  const [addLinkTrigger, setAddLinkTrigger] = useState<string | null>(null);

  useEffect(() => {
    const setupApp = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setDbReady(false);
        return;
      }

      try {
        await initializeNotifications();
      } catch (error) {
        console.warn("Notifications skipped:", error);
      }

      setDbReady(true);
    };

    setupApp();
  }, []);

  useEffect(() => {
    if (!dbReady) return;

    const subscription = setupNotificationListeners((response) => {
      console.log("Notification tapped:", response);
      const linkId = response.notification.request.content.data.linkId;
      if (linkId) {
      }
    });

    return () => {
      subscription.remove();
    };
  }, [dbReady]);

  useShareSheet((sharedUrl) => {
    if (sharedUrl) {
      setAddLinkTrigger(sharedUrl);
      Alert.alert(
        "Link Detected",
        "A link was shared with Nudge. Do you want to save it?",
        [
          {
            text: "Cancel",
            onPress: () => setAddLinkTrigger(null),
            style: "cancel",
          },
          {
            text: "Save",
            onPress: () => {
            },
          },
        ],
      );
    }
  });

  if (!dbReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
          translucent={false}
        />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
        translucent={false}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            initialParams={{ addLinkUrl: addLinkTrigger }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
