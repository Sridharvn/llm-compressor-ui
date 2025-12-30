import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { optimize, restore } from 'llm-chat-msg-compressor';
import debounce from 'lodash.debounce';
import { usePersistentState } from '@/hooks/usePersistentState';
import { SAMPLE_JSON, DEFAULT_OPTIONS } from '@/constants';
import type { Options, CompressionStats, EditorError, OutputMode } from '@/types/compression';

type CompressionContextType = {
  input: string;
  setInput: (val: string) => void;
  output: string;
  restored: string;
  options: Options;
  setOptions: (opts: Options) => void;
  error: EditorError;
  stats: CompressionStats;
  outputMode: OutputMode;
  setOutputMode: (mode: OutputMode) => void;
  runOptimization: (val: string, opts: Options) => void;
  handleClear: () => void;
};

const CompressionContext = createContext<CompressionContextType | undefined>(undefined);

export function CompressionProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = usePersistentState('llm-compressor-input', JSON.stringify(SAMPLE_JSON, null, 2));
  const [output, setOutput] = useState('');
  const [restored, setRestored] = useState('');
  const [outputMode, setOutputMode] = useState<OutputMode>('optimized');
  const [options, setOptions] = usePersistentState<Options>('llm-compressor-options', DEFAULT_OPTIONS);
  const [error, setError] = useState<EditorError>(null);

  const runOptimization = useMemo(
    () =>
      debounce((val: string, opts: Options) => {
        if (!val.trim()) {
          setOutput('');
          setRestored('');
          setError(null);
          return;
        }

        try {
          const parsed = JSON.parse(val);
          const optimized = optimize(parsed, {
            aggressive: opts.aggressive,
            unsafe: opts.unsafe,
          });
          setOutput(JSON.stringify(optimized, null, 2));
          
          const restoredData = restore(optimized);
          setRestored(JSON.stringify(restoredData, null, 2));
          
          setError(null);
        } catch (e: unknown) {
          let message = 'Unknown error';
          if (e instanceof Error) message = e.message;
          const match = message.match(/at line (\d+)/);
          setError({
            message,
            line: match ? parseInt(match[1]) : undefined
          });
          setOutput('');
          setRestored('');
        }
      }, 300),
    []
  );

  useEffect(() => {
    runOptimization(input, options);
  }, [input, options, runOptimization]);

  const stats = useMemo(() => {
    const inputSize = new Blob([input]).size;
    const inputTokens = Math.ceil(input.length / 4);

    if (error || !input.trim() || !output) {
      return {
        inputSize,
        outputSize: 0,
        savings: '0.0',
        inputTokens,
        outputTokens: 0,
        tokenSavings: '0.0'
      };
    }

    const outputSize = new Blob([output]).size;
    const savings = inputSize > 0 ? ((inputSize - outputSize) / inputSize) * 100 : 0;
    
    const outputTokens = Math.ceil(output.length / 4);
    const tokenSavings = inputTokens > 0 ? ((inputTokens - outputTokens) / inputTokens) * 100 : 0;

    return {
      inputSize,
      outputSize,
      savings: savings.toFixed(1),
      inputTokens,
      outputTokens,
      tokenSavings: tokenSavings.toFixed(1)
    };
  }, [input, output, error]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setRestored('');
    setError(null);
  };

  return (
    <CompressionContext.Provider value={{
      input, setInput, output, restored, options, setOptions, error, stats, outputMode, setOutputMode, runOptimization, handleClear
    }}>
      {children}
    </CompressionContext.Provider>
  );
}

export function useCompression() {
  const context = useContext(CompressionContext);
  if (context === undefined) {
    throw new Error('useCompression must be used within a CompressionProvider');
  }
  return context;
}
