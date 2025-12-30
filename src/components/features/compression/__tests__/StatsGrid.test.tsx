import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatsGrid } from '../StatsGrid';
import { CompressionProvider } from '@/providers/CompressionProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Mock the compression library
vi.mock('llm-chat-msg-compressor', () => ({
  optimize: vi.fn((data) => data),
  restore: vi.fn((data) => data),
}));

describe('StatsGrid', () => {
  it('renders initial stats correctly', () => {
    render(
      <ThemeProvider>
        <CompressionProvider>
          <StatsGrid />
        </CompressionProvider>
      </ThemeProvider>
    );

    // Check for "Original" and "Optimized" labels
    expect(screen.getByText(/Original/i)).toBeDefined();
    expect(screen.getByText(/Optimized/i)).toBeDefined();
    
    // Check for initial size (SAMPLE_JSON is roughly 700-800 bytes)
    const byteLabels = screen.getAllByText(/B/i);
    expect(byteLabels.length).toBeGreaterThan(0);
  });
});
