import axios from 'axios';

export interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
}

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || url;
  } catch {
    return url;
  }
};

const fetchMetadataWithTimeout = async (
  url: string,
  timeout: number = 5000
): Promise<OpenGraphMetadata | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const html = response.data;
    const metadata: OpenGraphMetadata = {
      title: null,
      description: null,
      image: null,
      domain: extractDomain(url),
    };

    // Extract Open Graph meta tags
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    }

    const ogDescriptionMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    );
    if (ogDescriptionMatch) {
      metadata.description = ogDescriptionMatch[1];
    }

    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      metadata.image = ogImageMatch[1];
    }

    // Fallback to regular meta tags if OG tags not found
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1];
      }
    }

    if (!metadata.description) {
      const descriptionMatch = html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
      );
      if (descriptionMatch) {
        metadata.description = descriptionMatch[1];
      }
    }

    return metadata;
  } catch (error) {
    console.warn('Failed to fetch metadata:', error);
    return null;
  }
};

export const fetchOpenGraphData = async (
  url: string
): Promise<OpenGraphMetadata> => {
  try {
    const metadata = await fetchMetadataWithTimeout(url);

    if (metadata) {
      return metadata;
    }

    // Return minimal metadata with just the domain
    return {
      title: null,
      description: null,
      image: null,
      domain: extractDomain(url),
    };
  } catch (error) {
    console.error('Error in fetchOpenGraphData:', error);
    return {
      title: null,
      description: null,
      image: null,
      domain: extractDomain(url),
    };
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    // Try adding http:// if no protocol
    try {
      new URL(`http://${url}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const normalizeUrl = (url: string): string => {
  if (!url.match(/^https?:\/\//)) {
    return `http://${url}`;
  }
  return url;
};
