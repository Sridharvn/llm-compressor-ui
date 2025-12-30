import { useState, useEffect } from 'react';
import type { UseDocumentationReturn, DocumentationData, DocumentationStatus } from '../types/documentation';
import { NPMService } from '../utils/npmService';
import { ContentMapper } from '../utils/contentMapper';
import { fallbackDocumentationData } from '../data/fallbackDocs';

export function useDocumentation(): UseDocumentationReturn {
  const [data, setData] = useState<DocumentationData>(fallbackDocumentationData);
  const [status, setStatus] = useState<DocumentationStatus>({
    isLive: false,
    isLoading: true,
    error: null,
    lastFetched: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDocumentation = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Fetch both README and metadata concurrently
        const [readme, metadata] = await Promise.all([
          NPMService.fetchReadme(),
          NPMService.fetchMetadata()
        ]);
        
        if (!isMounted) return;
        
        const parsedData = ContentMapper.parseMarkdown(readme, metadata);
        
        // Validate parsed data structure
        if (isValidDocumentationData(parsedData)) {
          setData(parsedData);
          setStatus({
            isLive: true,
            isLoading: false,
            error: null,
            lastFetched: new Date(),
          });
        } else {
          throw new Error('Invalid documentation structure from NPM');
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.warn('Failed to fetch live documentation, using fallback:', error);
        
        // Use fallback data
        setData(fallbackDocumentationData);
        setStatus({
          isLive: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastFetched: null,
        });
      }
    };

    fetchDocumentation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, status };
}

function isValidDocumentationData(data: unknown): data is DocumentationData {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  return Boolean(
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    obj.badges &&
    typeof obj.badges === 'object' &&
    obj.badges !== null &&
    typeof (obj.badges as Record<string, unknown>).npm === 'string' &&
    obj.sections &&
    typeof obj.sections === 'object' &&
    obj.sections !== null &&
    Array.isArray((obj.sections as Record<string, unknown>).features) &&
    Array.isArray((obj.sections as Record<string, unknown>).strategies) &&
    Array.isArray((obj.sections as Record<string, unknown>).performance) &&
    (obj.sections as Record<string, unknown>).installation &&
    typeof (obj.sections as Record<string, unknown>).installation === 'object' &&
    (obj.sections as Record<string, unknown>).installation !== null &&
    typeof ((obj.sections as Record<string, unknown>).installation as Record<string, unknown>).command === 'string' &&
    (obj.sections as Record<string, unknown>).usage &&
    typeof (obj.sections as Record<string, unknown>).usage === 'object' &&
    (obj.sections as Record<string, unknown>).usage !== null &&
    typeof ((obj.sections as Record<string, unknown>).usage as Record<string, unknown>).code === 'string' &&
    obj.metadata &&
    typeof obj.metadata === 'object' &&
    obj.metadata !== null &&
    typeof (obj.metadata as Record<string, unknown>).version === 'string' &&
    typeof (obj.metadata as Record<string, unknown>).license === 'string'
  );
}