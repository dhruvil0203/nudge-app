import * as Clipboard from "expo-clipboard";
import { isValidUrl, normalizeUrl } from "./metadata";

export const getClipboardUrl = async (): Promise<string | null> => {
  try {
    const text = await Clipboard.getStringAsync();
    if (text && isValidUrl(text)) {
      return normalizeUrl(text);
    }
  } catch (error) {
    console.warn("Failed to get clipboard:", error);
  }
  return null;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};
