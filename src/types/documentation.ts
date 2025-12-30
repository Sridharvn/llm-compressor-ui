export interface DocumentationFeature {
  icon: string;
  title: string;
  description: string;
}

export interface DocumentationStrategy {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface DocumentationPerformanceFeature {
  icon: string;
  title: string;
  description: string;
}

export interface DocumentationSection {
  features: DocumentationFeature[];
  installation: {
    command: string;
  };
  usage: {
    code: string;
    language: string;
  };
  strategies: DocumentationStrategy[];
  options: {
    code: string;
    language: string;
  };
  safety: {
    title: string;
    content: string;
  };
  performance: DocumentationPerformanceFeature[];
}

export interface PackageMetadata {
  version: string;
  description: string;
  license: string;
  author: {
    name: string;
    email?: string;
  };
  repository: {
    type: string;
    url: string;
  };
  homepage: string;
  keywords: string[];
  downloads?: {
    weekly: number;
    monthly: number;
  };
  lastPublished: string;
  size?: string;
}

export interface DocumentationData {
  title: string;
  description: string;
  badges: {
    npm: string;
    license: string;
    build: string;
  };
  sections: DocumentationSection;
  metadata: PackageMetadata;
}

export interface DocumentationStatus {
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

export interface UseDocumentationReturn {
  data: DocumentationData;
  status: DocumentationStatus;
}