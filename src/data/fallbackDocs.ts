import type { DocumentationData } from '../types/documentation';

export const fallbackDocumentationData: DocumentationData = {
  title: 'llm-chat-msg-compressor',
  description: 'Intelligent JSON optimizer for LLM APIs. Automatically reduces token usage by selecting the best compression strategy for your data payload.',
  badges: {
    npm: 'https://img.shields.io/npm/v/llm-chat-msg-compressor.svg',
    license: 'https://img.shields.io/npm/l/llm-chat-msg-compressor.svg',
    build: 'https://img.shields.io/github/actions/workflow/status/Sridharvn/llm-chat-msg-compressor/test.yml',
  },
  sections: {
    features: [
      {
        icon: '🧠',
        title: 'Intelligent',
        description: 'Analyzes payload structure to pick the best strategy',
      },
      {
        icon: '⚡',
        title: 'High Performance',
        description: 'Optimized for low-latency with single-pass analysis and zero production dependencies',
      },
      {
        icon: '📉',
        title: 'Significant Savings',
        description: 'Achieves 15-70% token reduction across various data structures',
      },
      {
        icon: '✅',
        title: 'Lossless',
        description: '100% data fidelity with perfect restoration capabilities',
      },
      {
        icon: '🔌',
        title: 'Universal',
        description: 'Works with any JSON payload - chat messages, API responses, configurations',
      },
    ],
    installation: {
      command: 'npm install llm-chat-msg-compressor',
    },
    usage: {
      code: `import { optimize, restore } from 'llm-chat-msg-compressor';

const originalData = {
  messages: [
    { role: 'user', content: 'Hello there!' },
    { role: 'assistant', content: 'Hi! How can I help?' }
  ]
};

// Compress for API call
const compressed = optimize(originalData);
console.log('Savings:', compressed.meta.savings);

// Restore after processing
const restored = restore(compressed);
console.log('Perfect match:', JSON.stringify(originalData) === JSON.stringify(restored));`,
      language: 'javascript',
    },
    strategies: [
      {
        title: 'Key Abbreviation',
        description: 'Shortens common JSON keys while maintaining readability',
        icon: '🔤',
        color: 'blue',
      },
      {
        title: 'Value Compression',
        description: 'Optimizes string values and removes unnecessary whitespace',
        icon: '📦',
        color: 'purple',
      },
      {
        title: 'Structure Flattening',
        description: 'Reduces nesting levels where semantically safe',
        icon: '🗜️',
        color: 'green',
      },
      {
        title: 'Smart Defaults',
        description: 'Eliminates redundant data by leveraging common patterns',
        icon: '🎯',
        color: 'orange',
      },
    ],
    options: {
      code: `const options = {
  aggressive: false,  // More aggressive compression
  unsafe: false       // Allow potentially unsafe optimizations
};

const compressed = optimize(data, options);`,
      language: 'javascript',
    },
    safety: {
      title: 'Safety & Types',
      content: 'Full TypeScript support with type-safe operations and comprehensive input validation. The library ensures 100% data fidelity through rigorous testing and semantic preservation.',
    },
    performance: [
      {
        icon: '⚡',
        title: 'Millisecond Processing',
        description: 'Optimizes large payloads in under 10ms',
      },
      {
        icon: '🎯',
        title: 'Memory Efficient',
        description: 'Minimal memory footprint during processing',
      },
      {
        icon: '📊',
        title: 'Predictable Performance',
        description: 'Linear time complexity with data size',
      },
    ],
  },
  metadata: {
    version: '1.0.4',
    description: 'Intelligent JSON compression for LLM API optimization',
    license: 'MIT',
    author: {
      name: 'Sridharvn'
    },
    repository: {
      type: 'git',
      url: 'git+https://github.com/Sridharvn/llm-chat-msg-compressor.git'
    },
    homepage: 'https://sridharvn.github.io/llm-compressor-ui/',
    keywords: [
      'llm',
      'openai',
      'json',
      'compression',
      'optimization',
      'tokens',
      'chat',
      'gpt',
      'api',
      'completions',
      'messages',
      'tokenization'
    ],
    lastPublished: new Date().toISOString(),
  },
};