import type { PackageMetadata } from '../types/documentation';

const NPM_PACKAGE_NAME = 'llm-chat-msg-compressor';
const NPM_README_API = `https://registry.npmjs.org/${NPM_PACKAGE_NAME}`;
const NPM_DOWNLOADS_API = `https://api.npmjs.org/downloads/point/last-week/${NPM_PACKAGE_NAME}`;
const CACHE_KEY = 'npm-readme-cache';
const METADATA_CACHE_KEY = 'npm-metadata-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedData {
  content: string;
  timestamp: number;
}

interface CachedMetadata {
  metadata: PackageMetadata;
  timestamp: number;
}

export class NPMService {
  static async fetchReadme(): Promise<string> {
    // Check cache first
    const cached = this.getCachedContent();
    if (cached) {
      return cached;
    }

    try {
      // Fetch from NPM registry
      const response = await fetch(NPM_README_API);
      if (!response.ok) {
        throw new Error(`NPM API error: ${response.status}`);
      }

      const data = await response.json();
      const readme = data.readme;

      if (!readme) {
        throw new Error('No README found in NPM response');
      }

      // Cache the content
      this.cacheContent(readme);
      
      return readme;
    } catch (error) {
      console.warn('Failed to fetch NPM README:', error);
      throw error;
    }
  }

  static async fetchMetadata(): Promise<PackageMetadata> {
    // Check cache first
    const cached = this.getCachedMetadata();
    if (cached) {
      return cached;
    }

    try {
      // Fetch package metadata
      const response = await fetch(NPM_README_API);
      if (!response.ok) {
        throw new Error(`NPM API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Get latest version info
      const latestVersion = data['dist-tags']?.latest;
      const versionData = latestVersion ? data.versions?.[latestVersion] : null;
      const timeData = data.time || {};

      // Try to get download stats (might not be available for newer packages)
      let downloads;
      try {
        const downloadResponse = await fetch(NPM_DOWNLOADS_API);
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          downloads = {
            weekly: downloadData.downloads || 0,
            monthly: downloadData.downloads * 4 || 0 // Estimate monthly from weekly
          };
        }
      } catch {
        // Downloads API might not have data for this package
        downloads = undefined;
      }

      const metadata: PackageMetadata = {
        version: latestVersion || '1.0.0',
        description: data.description || 'Intelligent JSON compression for LLM API optimization',
        license: data.license || 'MIT',
        author: data.author || { name: 'Sridharvn' },
        repository: data.repository || { 
          type: 'git', 
          url: 'git+https://github.com/Sridharvn/llm-chat-msg-compressor.git' 
        },
        homepage: data.homepage || 'https://sridharvn.github.io/llm-compressor-ui/',
        keywords: data.keywords || [],
        downloads,
        lastPublished: timeData.modified || timeData[latestVersion] || new Date().toISOString(),
        size: versionData?.dist?.unpackedSize ? this.formatBytes(versionData.dist.unpackedSize) : undefined,
      };

      // Cache the metadata
      this.cacheMetadata(metadata);
      
      return metadata;
    } catch (error) {
      console.warn('Failed to fetch NPM metadata:', error);
      throw error;
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private static getCachedContent(): string | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { content, timestamp }: CachedData = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return content;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  private static getCachedMetadata(): PackageMetadata | null {
    try {
      const cached = localStorage.getItem(METADATA_CACHE_KEY);
      if (!cached) return null;

      const { metadata, timestamp }: CachedMetadata = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(METADATA_CACHE_KEY);
        return null;
      }

      return metadata;
    } catch {
      localStorage.removeItem(METADATA_CACHE_KEY);
      return null;
    }
  }

  private static cacheContent(content: string): void {
    try {
      const cacheData: CachedData = {
        content,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache README content:', error);
    }
  }

  private static cacheMetadata(metadata: PackageMetadata): void {
    try {
      const cacheData: CachedMetadata = {
        metadata,
        timestamp: Date.now(),
      };
      localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache metadata:', error);
    }
  }

  static clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(METADATA_CACHE_KEY);
  }
}