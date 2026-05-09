import { useEffect } from "react";
import { Linking } from "react-native";

export const useDeepLink = (onLinkReceived?: (url: string) => void) => {
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url != null) {
        // Extract the path from the URL
        const route = url.replace(/.*?:\/\//g, "");
        console.log("Deep link received:", route);
        onLinkReceived?.(route);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened from URL
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onLinkReceived]);
};
