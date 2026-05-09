import { useEffect, useState } from "react";
import { useShareIntent } from "expo-share-intent";

export interface SharedItem {
  url?: string;
  text?: string;
  weblink?: string;
  filePath?: string;
}

export const useShareSheet = (onSharedUrl?: (url: string) => void) => {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (!hasShareIntent) return;

    const url =
      shareIntent.webUrl ??
      (shareIntent.type === "text" ? shareIntent.text : undefined);

    if (url) {
      setSharedUrl(url);
      onSharedUrl?.(url);
    }
  }, [hasShareIntent, shareIntent, onSharedUrl]);

  const clearSharedUrl = () => {
    setSharedUrl(null);
    resetShareIntent();
  };

  return { sharedUrl, clearSharedUrl };
};
