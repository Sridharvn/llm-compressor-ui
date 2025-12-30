import { getEncoding } from "js-tiktoken";

// Using cl100k_base as it's the standard for GPT-3.5 and GPT-4
// You can also use "o200k_base" for GPT-4o if supported by the version installed
const encoding = getEncoding("cl100k_base");

/**
 * Counts the number of tokens in a string using the cl100k_base encoding.
 * This is the standard encoding for GPT-3.5 and GPT-4 models.
 */
export function countTokens(text: string | null | undefined): number {
  if (!text) return 0;
  try {
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    console.error("Tokenization error:", error);
    // Fallback to a rough heuristic if tokenization fails
    return Math.ceil(text.length / 4);
  }
}

/**
 * Returns the name of the encoding being used.
 */
export function getEncodingName(): string {
  return "cl100k_base (GPT-4)";
}
