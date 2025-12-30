import type { DocumentationData, DocumentationSection, PackageMetadata } from '../types/documentation';

export class ContentMapper {
  static parseMarkdown(markdown: string, metadata: PackageMetadata): DocumentationData {
    try {
      return {
        title: this.extractTitle(markdown),
        description: this.extractDescription(markdown),
        badges: this.extractBadges(),
        sections: this.extractSections(markdown),
        metadata,
      };
    } catch (error) {
      console.warn('Failed to parse markdown:', error);
      throw new Error('Invalid markdown structure');
    }
  }

  private static extractTitle(markdown: string): string {
    const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m);
    return titleMatch ? titleMatch[1].trim() : 'llm-chat-msg-compressor';
  }

  private static extractDescription(markdown: string): string {
    // Look for description after title but before features
    // Skip any badge lines and markdown links
    const lines = markdown.split('\n');
    let titleFound = false;
    let description = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Found title line
      if (trimmedLine.startsWith('# ')) {
        titleFound = true;
        continue;
      }
      
      // Skip if we haven't found the title yet
      if (!titleFound) continue;
      
      // Skip badge lines (lines with [![ or just [)
      if (trimmedLine.includes('[![') || trimmedLine.match(/^\[.*\]\(.*\)$/)) continue;
      
      // Stop at next heading or features section
      if (trimmedLine.startsWith('#') || trimmedLine.toLowerCase().includes('features')) break;
      
      // This should be our description
      if (trimmedLine && !trimmedLine.includes('[') && !trimmedLine.includes('![')) {
        description = trimmedLine;
        break;
      }
    }
    
    return description || 'Intelligent JSON optimizer for LLM APIs. Automatically reduces token usage by selecting the best compression strategy for your data payload.';
  }

  private static extractBadges(): { npm: string; license: string; build: string } {
    return {
      npm: 'https://img.shields.io/npm/v/llm-chat-msg-compressor.svg',
      license: 'https://img.shields.io/npm/l/llm-chat-msg-compressor.svg',
      build: 'https://img.shields.io/github/actions/workflow/status/Sridharvn/llm-chat-msg-compressor/test.yml',
    };
  }

  private static extractSections(markdown: string): DocumentationSection {
    return {
      features: this.extractFeatures(markdown),
      installation: this.extractInstallation(markdown),
      usage: this.extractUsage(markdown),
      strategies: this.extractStrategies(markdown),
      options: this.extractOptions(markdown),
      safety: this.extractSafety(markdown),
      performance: this.extractPerformance(markdown),
    };
  }

  private static extractFeatures(markdown: string) {
    // Look for features section
    const featuresSection = markdown.match(/##?\s*Features(.*?)(?=##|$)/si);
    if (!featuresSection) return this.getDefaultFeatures();

    const features: Array<{ icon: string; title: string; description: string }> = [];
    const featureMatches = featuresSection[1].match(/[*-]\s*(.+)/g);
    
    if (featureMatches) {
      const iconMap = ['🧠', '⚡', '📉', '✅', '🔌'];
      featureMatches.slice(0, 5).forEach((match, index) => {
        const text = match.replace(/^[*-]\s*/, '').trim();
        const [title, ...descParts] = text.split(':');
        features.push({
          icon: iconMap[index] || '✨',
          title: title.trim(),
          description: descParts.join(':').trim() || 'Feature description',
        });
      });
    }

    return features.length > 0 ? features : this.getDefaultFeatures();
  }

  private static extractInstallation(markdown: string) {
    const installMatch = markdown.match(/```(?:bash|shell)?\s*\n(npm install[^`]+)/);
    return {
      command: installMatch ? installMatch[1].trim() : 'npm install llm-chat-msg-compressor',
    };
  }

  private static extractUsage(markdown: string) {
    // Look for Usage section specifically
    const usageSection = markdown.match(/##?\s*Usage([\s\S]*?)(?=##|$)/i);
    if (!usageSection) {
      return {
        code: this.getDefaultUsageCode(),
        language: 'javascript',
      };
    }

    // Find the code block within the usage section
    const usageMatch = usageSection[1].match(/```(?:javascript|js|typescript|ts)?\s*\n([\s\S]*?)```/);
    return {
      code: usageMatch ? usageMatch[1].trim() : this.getDefaultUsageCode(),
      language: usageMatch && usageMatch[0].includes('typescript') ? 'typescript' : 'javascript',
    };
  }

  private static extractStrategies(markdown: string) {
    const strategiesSection = markdown.match(/##?\s*(?:Strategies|Compression Strategies)(.*?)(?=##|$)/si);
    if (!strategiesSection) return this.getDefaultStrategies();

    const strategies: Array<{ title: string; description: string; icon: string; color: string }> = [];
    const strategyMatches = strategiesSection[1].match(/\d+\.\s*\*\*(.+?)\*\*[:?-]?\s*(.+?)(?=\d+\.|$)/gs);
    
    if (strategyMatches) {
      const colors = ['blue', 'purple', 'green', 'orange'];
      const icons = ['🔤', '📦', '🗜️', '🎯'];
      
      strategyMatches.slice(0, 4).forEach((match, index) => {
        const titleMatch = match.match(/\*\*(.+?)\*\*/);
        const descMatch = match.replace(/\d+\.\s*\*\*[^*]+\*\*[:?-]?\s*/, '').trim();
        
        strategies.push({
          title: titleMatch ? titleMatch[1] : `Strategy ${index + 1}`,
          description: descMatch || 'Strategy description',
          icon: icons[index] || '🎯',
          color: colors[index] || 'blue',
        });
      });
    }

    return strategies.length > 0 ? strategies : this.getDefaultStrategies();
  }

  private static extractOptions(markdown: string) {
    const optionsMatch = markdown.match(/```(?:javascript|js|typescript|ts)?\s*\n([\s\S]*?options[\s\S]*?)```/i);
    return {
      code: optionsMatch ? optionsMatch[1].trim() : this.getDefaultOptionsCode(),
      language: 'javascript',
    };
  }

  private static extractSafety(markdown: string) {
    const safetySection = markdown.match(/##?\s*(?:Safety|Types|Safety & Types)(.*?)(?=##|$)/si);
    return {
      title: 'Safety & Types',
      content: safetySection 
        ? safetySection[1].trim() 
        : 'Full TypeScript support with type-safe operations and comprehensive input validation.',
    };
  }

  private static extractPerformance(markdown: string) {
    const perfSection = markdown.match(/##?\s*Performance(.*?)(?=##|$)/si);
    if (!perfSection) return this.getDefaultPerformance();

    const features: Array<{ icon: string; title: string; description: string }> = [];
    const perfMatches = perfSection[1].match(/[*-]\s*(.+)/g);
    
    if (perfMatches) {
      const icons = ['⚡', '🎯', '📊'];
      perfMatches.slice(0, 3).forEach((match, index) => {
        const text = match.replace(/^[*-]\s*/, '').trim();
        const [title, ...descParts] = text.split(':');
        features.push({
          icon: icons[index] || '⚡',
          title: title.trim(),
          description: descParts.join(':').trim() || 'Performance feature',
        });
      });
    }

    return features.length > 0 ? features : this.getDefaultPerformance();
  }

  // Default fallback data
  private static getDefaultFeatures() {
    return [
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
    ];
  }

  private static getDefaultStrategies() {
    return [
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
    ];
  }

  private static getDefaultPerformance() {
    return [
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
    ];
  }

  private static getDefaultUsageCode() {
    return `import { optimize, restore } from 'llm-chat-msg-compressor';
import OpenAI from 'openai';

const data = {
  users: [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "viewer" },
    // ... 100 more users
  ],
};

// 1. Optimize before sending to LLM
const optimizedData = optimize(data);

// 2. Send to LLM
const completion = await openai.chat.completions.create({
  messages: [{ role: "user", content: JSON.stringify(optimizedData) }],
  model: "gpt-4",
});

// 3. (Optional) Restore if you need to process response in same format
// const original = restore(responseFromLLM);`;
  }

  private static getDefaultOptionsCode() {
    return `const options = {
  aggressive: false,  // More aggressive compression
  unsafe: false       // Allow potentially unsafe optimizations
};

const compressed = optimize(data, options);`;
  }
}