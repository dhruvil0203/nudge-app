import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus, Platform } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { useTheme } from './src/context/ThemeContext';
import { initDatabase, recoverCorruptedData } from './src/utils/database';
import { initializeNotifications, getLastNotificationResponse } from './src/utils/notifications';
import { LinksProvider } from './src/hooks/useLinks';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { lightTheme, darkTheme } from './src/constants/theme';

const Stack = createNativeStackNavigator();

// Global error handler for unhandled promise rejections
if (__DEV__) {
  const originalHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('[GlobalErrorHandler]', error.message, error.stack);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRecovering: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null, isRecovering: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, this would send to a crash reporting service
    console.error('[ErrorBoundary] Caught error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500),
      componentStack: info.componentStack?.substring(0, 500),
    });
  }

  handleRetry = async () => {
    this.setState({ isRecovering: true });
    try {
      const recovered = await recoverCorruptedData();
      this.setState({ hasError: false, error: null, isRecovering: false });
    } catch {
      this.setState({ isRecovering: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.icon}>🧡</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message
              ? this.state.error.message.length > 100
                ? this.state.error.message.substring(0, 100) + '...'
                : this.state.error.message
              : 'An unexpected error occurred. We\'ve logged this and will investigate.'}
          </Text>
          <TouchableOpacity
            style={errorStyles.retryButton}
            onPress={this.handleRetry}
            disabled={this.state.isRecovering}
            activeOpacity={0.7}
          >
            <Text style={errorStyles.retryText}>
              {this.state.isRecovering ? 'Recovering...' : 'Tap to Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#E8A882',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await initDatabase();
        if (mounted) {
          setDbReady(true);
          // Initialize notifications in background - don't block UI
          initializeNotifications().catch(() => {});
        }
      } catch (err) {
        console.error('[App] Database init failed:', err);
        if (mounted) {
          // Try recovery
          try {
            const recovered = await recoverCorruptedData();
            if (recovered) {
              await initDatabase();
              if (mounted) setDbReady(true);
            } else {
              setInitError('Failed to initialize storage. Please restart the app.');
            }
          } catch {
            if (mounted) {
              setInitError('Failed to initialize storage. Please restart the app.');
            }
          }
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle app state changes for background/foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // App came to foreground - refresh data
        getLastNotificationResponse().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => {
      subscription.remove();
    };
  }, []);

  if (initError) {
    return (
      <View style={errorStyles.container}>
        <Text style={errorStyles.title}>Initialization Error</Text>
        <Text style={errorStyles.message}>{initError}</Text>
        <TouchableOpacity
          style={errorStyles.retryButton}
          onPress={() => {
            setInitError(null);
            setDbReady(false);
            // Trigger re-init
            initDatabase()
              .then(() => setDbReady(true))
              .catch(() => setInitError('Failed to initialize storage. Please restart the app.'));
          }}
          activeOpacity={0.7}
        >
          <Text style={errorStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={errorStyles.container}>
        <Text style={errorStyles.icon}>🧡</Text>
        <Text style={[errorStyles.title, { opacity: 0.5 }]}>Nudge</Text>
      </View>
    );
  }

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
