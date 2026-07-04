import { useEffect, useState, useRef } from "react";
import * as Linking from "expo-linking";

export interface SharedItem {
  url?: string;
  text?: string;
  weblink?: string;
  filePath?: string;
}

export const useShareSheet = (onSharedUrl?: (url: string) => void) => {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const onSharedUrlRef = useRef(onSharedUrl);
  onSharedUrlRef.current = onSharedUrl;
  const processedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const url = event.url;
      if (url && url !== processedUrlRef.current) {
        processedUrlRef.current = url;
        setSharedUrl(url);
        onSharedUrlRef.current?.(url);
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url && url !== processedUrlRef.current) {
        processedUrlRef.current = url;
        setSharedUrl(url);
        onSharedUrlRef.current?.(url);
      }
    });

    return () => sub.remove();
  }, []);

  const clearSharedUrl = () => {
    setSharedUrl(null);
    processedUrlRef.current = null;
  };

  return { sharedUrl, clearSharedUrl };
};
