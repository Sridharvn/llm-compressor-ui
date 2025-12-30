export type Options = {
  aggressive: boolean;
  unsafe: boolean;
};

export type CompressionStats = {
  inputSize: number;
  outputSize: number;
  savings: string;
  inputTokens: number;
  outputTokens: number;
  tokenSavings: string;
};

export type EditorError = {
  message: string;
  line?: number;
} | null;

export type OutputMode = 'optimized' | 'restored';
