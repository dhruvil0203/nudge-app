import { useEffect, useRef } from "react";
import { Linking } from "react-native";

export const useDeepLink = (onLinkReceived?: (url: string) => void) => {
  const onLinkReceivedRef = useRef(onLinkReceived);
  onLinkReceivedRef.current = onLinkReceived;

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url != null) {
        const route = url.replace(/.*?:\/\//g, "");
        onLinkReceivedRef.current?.(route);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []); // Empty deps - uses ref for callback
};
