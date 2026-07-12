import axios from 'axios';
import type { OpenGraphMetadata } from "../types";

// List of blocked IP ranges and private networks to prevent SSRF
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  '[::1]',
  '[0:0:0:0:0:0:0:1]',
  '169.254.',
];

const MAX_RESPONSE_SIZE = 1_000_000; // 1MB max response size
const REQUEST_TIMEOUT = 5000;

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.some((blocked) => lower.startsWith(blocked));
}

function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Only allow http and https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }

    // Block private/internal IPs
    if (isBlockedHostname(urlObj.hostname)) {
      return false;
    }

    // Block IP addresses (potential SSRF)
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipPattern.test(urlObj.hostname)) {
      return false;
    }

    // Ensure reasonable URL length
    if (url.length > 2048) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname || url;
    // Strip www. prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const fetchOpenGraphData = async (
  url: string
): Promise<OpenGraphMetadata> => {
  // Default fallback
  const fallback: OpenGraphMetadata = {
    title: null,
    description: null,
    image: null,
    domain: extractDomain(url),
  };

  // Validate URL before making request (SSRF prevention)
  if (!validateUrl(url)) {
    console.warn('[Metadata] Blocked potentially unsafe URL:', url.substring(0, 100));
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await axios.get<string>(url, {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: MAX_RESPONSE_SIZE,
      maxBodyLength: MAX_RESPONSE_SIZE,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
    });

    clearTimeout(timeoutId);

    const html = typeof response.data === 'string' ? response.data : '';
    const metadata: OpenGraphMetadata = {
      title: null,
      description: null,
      image: null,
      domain: extractDomain(url),
    };

    // Safe regex matching with limits
    try {
      const ogTitleMatch = html.match(
        /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
      );
      if (ogTitleMatch) {
        metadata.title = ogTitleMatch[1].substring(0, 500);
      }

      const ogDescriptionMatch = html.match(
        /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
      );
      if (ogDescriptionMatch) {
        metadata.description = ogDescriptionMatch[1].substring(0, 1000);
      }

      const ogImageMatch = html.match(
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
      );
      if (ogImageMatch) {
        const imageUrl = ogImageMatch[1];
        // Only accept https images for security
        if (imageUrl.startsWith('https://')) {
          metadata.image = imageUrl.substring(0, 2000);
        }
      }

      if (!metadata.title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          metadata.title = titleMatch[1].trim().substring(0, 500);
        }
      }

      if (!metadata.description) {
        const descriptionMatch = html.match(
          /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
        );
        if (descriptionMatch) {
          metadata.description = descriptionMatch[1].substring(0, 1000);
        }
      }
    } catch (parseError) {
      console.warn('[Metadata] Failed to parse HTML:', parseError);
    }

    return metadata;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Metadata] Request timeout for:', url.substring(0, 100));
      } else if (error.response) {
        console.warn('[Metadata] HTTP error:', error.response.status, 'for:', url.substring(0, 100));
      } else {
        console.warn('[Metadata] Network error for:', url.substring(0, 100));
      }
    } else {
      console.warn('[Metadata] Failed to fetch metadata:', error);
    }
    return fallback;
  }
};

export const isValidUrl = (url: string): boolean => {
  if (!url || url.length > 2048) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // Try with https prefix
    try {
      const urlObj = new URL(`https://${url}`);
      return urlObj.hostname.includes('.') && !isBlockedHostname(urlObj.hostname);
    } catch {
      return false;
    }
  }
};

export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};
