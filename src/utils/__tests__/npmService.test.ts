import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NPMService } from '../npmService';

describe('NPMService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('should fetch readme from NPM registry', async () => {
    const mockReadme = '# Test Readme';
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ readme: mockReadme }),
    });

    const readme = await NPMService.fetchReadme();
    expect(readme).toBe(mockReadme);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should use cached readme if available and not expired', async () => {
    const mockReadme = '# Cached Readme';
    const cacheData = {
      content: mockReadme,
      timestamp: Date.now(),
    };
    localStorage.setItem('npm-readme-cache', JSON.stringify(cacheData));

    const readme = await NPMService.fetchReadme();
    expect(readme).toBe(mockReadme);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch new readme if cache is expired', async () => {
    const oldReadme = '# Old Readme';
    const newReadme = '# New Readme';
    const cacheData = {
      content: oldReadme,
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    };
    localStorage.setItem('npm-readme-cache', JSON.stringify(cacheData));

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ readme: newReadme }),
    });

    const readme = await NPMService.fetchReadme();
    expect(readme).toBe(newReadme);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(NPMService.fetchReadme()).rejects.toThrow('NPM API error: 404');
  });
});
