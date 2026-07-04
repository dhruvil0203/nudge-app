import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { useTheme } from './src/context/ThemeContext';
import { initDatabase } from './src/utils/database';
import { initializeNotifications } from './src/utils/notifications';
import { LinksProvider } from './src/hooks/useLinks';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { lightTheme, darkTheme } from './src/constants/theme';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message}</Text>
          <Text
            style={errorStyles.retry}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            Tap to retry
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D', padding: 24 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retry: { color: '#E8A882', fontSize: 16, fontWeight: '600' },
});

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const navTheme = isDark
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          background: darkTheme.background,
          card: darkTheme.background,
          text: darkTheme.text,
          border: darkTheme.border,
          primary: darkTheme.primary,
        },
      }
    : {
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          background: lightTheme.background,
          card: lightTheme.surface,
          text: lightTheme.text,
          border: lightTheme.border,
          primary: lightTheme.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      {children}
    </NavigationContainer>
  );
}

function AppNavigator() {
  const { isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: isDark ? darkTheme.background : lightTheme.background,
        },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
        initializeNotifications().catch(() => {});
      })
      .catch((err) => {
        console.error('Database init failed:', err);
        setDbReady(true);
      });
  }, []);

  if (!dbReady) return null;

  return (
    <LinksProvider>
      <NavigationThemeWrapper>
        <StatusBar style="light" translucent />
        <AppNavigator />
      </NavigationThemeWrapper>
    </LinksProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <ProfileProvider>
                <AppContent />
              </ProfileProvider>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
