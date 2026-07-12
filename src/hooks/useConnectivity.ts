import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

interface ConnectivityState {
  isConnected: boolean;
  isOffline: boolean;
  lastOnlineTimestamp: number | null;
}

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const CHECK_URL = "https://clients3.google.com/generate_204";

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(CHECK_URL, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>({
    isConnected: true,
    isOffline: false,
    lastOnlineTimestamp: Date.now(),
  });

  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const performCheck = useCallback(async () => {
    if (!mountedRef.current) return;

    const now = Date.now();
    // Throttle checks to avoid excessive requests
    if (now - lastCheckRef.current < 5000) return;
    lastCheckRef.current = now;

    const isConnected = await checkConnectivity();

    if (!mountedRef.current) return;

    setState((prev) => ({
      isConnected,
      isOffline: !isConnected,
      lastOnlineTimestamp: isConnected ? now : prev.lastOnlineTimestamp,
    }));
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial check
    performCheck();

    // Periodic connectivity checks
    intervalRef.current = setInterval(performCheck, CHECK_INTERVAL_MS);

    // Check on app state changes (foreground)
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        performCheck();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [performCheck]);

  return state;
}

// Connectivity banner is rendered inline in HomeScreen
// to have access to theme context
