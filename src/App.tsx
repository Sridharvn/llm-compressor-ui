/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { optimize, restore } from 'llm-chat-msg-compressor';
import debounce from 'lodash.debounce';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { 
  Zap, 
  Copy, 
  Check,
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Moon, 
  Sun, 
  FileJson,
  Github,
  Info,
  Download,
  Linkedin
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useDocumentation } from './hooks/useDocumentation';
import { countTokens, getEncodingName } from './utils/tokenizer';

const SAMPLE_JSON = {
  "metadata": {
    "session_id": "chat_9823471",
    "timestamp": "2025-12-30T10:00:00Z",
    "user": {
      "id": "usr_442",
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "languages": ["en", "es", "fr"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant specialized in data compression."
    },
    {
      "role": "user",
      "content": "Can you analyze this complex data structure and tell me how to optimize it for LLM token usage?"
    },
    {
      "role": "assistant",
      "content": "I can certainly help with that. Using schema separation and key abbreviation can significantly reduce token counts."
    }
  ],
  "context_window": {
    "limit": 128000,
    "current_usage": 450,
    "history": [
      {"event": "login", "status": "success"},
      {"event": "query", "type": "optimization"},
      {"event": "response", "latency_ms": 120}
    ]
  }
};

const LARGE_SAMPLE_JSON = {
  "system_info": {
    "version": "2.4.0",
    "environment": "production",
    "features": ["auth", "billing", "analytics", "search", "notifications", "webhooks"]
  },
  "user_data": Array.from({ length: 10 }).map((_, i) => ({
    "id": `user_${i}`,
    "name": `User ${i}`,
    "email": `user${i}@example.com`,
    "role": i === 0 ? "admin" : "user",
    "status": "active",
    "last_login": "2025-12-30T10:00:00Z",
    "metadata": {
      "login_count": 42 + i,
      "preferences": {
        "theme": "dark",
        "lang": "en"
      }
    }
  })),
  "recent_logs": Array.from({ length: 5 }).map((_, i) => ({
    "timestamp": "2025-12-30T10:05:00Z",
    "level": "info",
    "message": `System event ${i} occurred successfully`,
    "context": {
      "request_id": `req_abc123_${i}`,
      "duration_ms": 100 + i * 10
    }
  }))
};

type Options = {
  aggressive: boolean;
  unsafe: boolean;
};

export default function App() {
  // Documentation
  const { data: docData, status: docStatus } = useDocumentation();

  // State
  const [input, setInput] = useState(() => {
    const saved = localStorage.getItem('llm-compressor-input');
    return saved || JSON.stringify(SAMPLE_JSON, null, 2);
  });
  const [output, setOutput] = useState('');
  const [restored, setRestored] = useState('');
  const [outputMode, setOutputMode] = useState<'optimized' | 'restored'>('optimized');
  const [options, setOptions] = useState<Options>(() => {
    const saved = localStorage.getItem('llm-compressor-options');
    return saved ? JSON.parse(saved) : { aggressive: false, unsafe: false };
  });
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const isDark = true; // dark mode only
  const [error, setError] = useState<{ message: string; line?: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('llm-compressor-input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('llm-compressor-options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    // Enforce dark mode only
    document.documentElement.classList.add('dark');
  }, []);

  // Optimization Logic
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

  // Stats
  const stats = useMemo(() => {
    const inputSize = new Blob([input]).size;
    const inputTokens = countTokens(input);

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
    
    // Precise token counting using js-tiktoken
    const outputTokens = countTokens(output);
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

  // Handlers
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      toast.success('JSON Formatted');
    } catch {
      toast.error('Cannot format: Invalid JSON');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      // Check if the pasted text itself is valid JSON
      JSON.parse(pastedText);
      
      // If it is, we'll format the whole input after it's updated
      setTimeout(() => {
        setInput(prev => {
          try {
            const parsed = JSON.parse(prev);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return prev;
          }
        });
        toast.success('Pasted JSON Formatted', {
          id: 'paste-format',
          style: {
            background: '#1f2937',
            color: '#d4d4d8',
          },
        });
      }, 0);
    } catch (e) {
      // Not valid JSON, just let the default paste happen
    }
  };

  const handleCopy = async () => {
    const textToCopy = outputMode === 'optimized' ? output : restored;
    if (!textToCopy) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      toast.success('Copied to clipboard!', {
        style: {
          background: '#1f2937',
          color: '#d4d4d8',
        },
      });
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopySection = async (id: string, text: string) => {
    if (!text) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard!', {
        style: {
          background: '#1f2937',
          color: '#d4d4d8',
        },
      });
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const text = outputMode === 'optimized' ? output : restored;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputMode === 'optimized' ? 'optimized.json' : 'restored.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleVerify = () => {
    try {
      const parsedInput = JSON.parse(input);
      const parsedOutput = JSON.parse(output);
      const restored = restore(parsedOutput);
      
      // Semantic equality check
      const isMatch = JSON.stringify(parsedInput) === JSON.stringify(restored);
      
      if (isMatch) {
        toast.success('Verification Passed: 100% Data Fidelity', {
          icon: '✅',
          duration: 4000,
          style: {
            background: isDark ? '#064e3b' : '#ecfdf5',
            color: isDark ? '#34d399' : '#065f46',
            border: `1px solid ${isDark ? '#065f46' : '#a7f3d0'}`,
          },
        });
      } else {
        toast.error('Verification Failed: Data Mismatch');
      }
    } catch {
      toast.error('Verification Error: Invalid JSON');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setRestored('');
    setError(null);
    toast('Workspace cleared', { icon: '🗑️' });
  };

  const handleLoadSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    toast.success('Sample data loaded');
  };

  const handleLoadLargeSample = () => {
    setInput(JSON.stringify(LARGE_SAMPLE_JSON, null, 2));
    toast.success('Large sample data loaded');
  };

  const highlightWithErrors = (code: string, errorLine?: number) => {
    const highlighted = highlight(code, languages.json, 'json');
    if (!errorLine) return highlighted;

    const lines = highlighted.split('\n');
    return lines.map((line, i) => {
      if (i + 1 === errorLine) {
        return `<span class="error-line-highlight">${line}</span>`;
      }
      return line;
    }).join('\n');
  };

  const renderLineNumbers = (content: string, errorLine?: number) => {
    const lines = content.split('\n');
    return (
      <div className="line-numbers">
        {lines.map((_, i) => (
          <div key={i} className={errorLine === i + 1 ? 'line-number-error' : ''}>
            {i + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-zinc-800 text-zinc-100">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-600 bg-zinc-700/50 backdrop-blur-md z-10">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-1.5 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">LLM Compressor</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-400">{docData.title}</p>
                <div 
                  className={`status-indicator ${docStatus.isLive ? 'live' : 'fallback'}`}
                  title={docStatus.isLive ? `Live data from NPM (last fetched: ${docStatus.lastFetched?.toLocaleString()})` : `Fallback data ${docStatus.error ? `(${docStatus.error})` : ''}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="https://www.linkedin.com/in/sridhar-v-nampoothiripad/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors`}
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://www.npmjs.com/package/llm-chat-msg-compressor" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors`}
              title="View on NPM"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0v24h6.75V6.75H9V24h15V0H0zm6.75 3H21v18H15V9.75h-2.25V21H3V3h3.75z"/>
              </svg>
            </a>
            <a 
              href="https://github.com/Sridharvn/llm-chat-msg-compressor" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors`}
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Enhanced Stats Display */}
      <div className="shrink-0 border-b border-zinc-600 bg-gradient-to-r from-zinc-700/40 via-zinc-700/30 to-zinc-700/40">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Original Size Card */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50 backdrop-blur-sm' : 'bg-white/80 border-zinc-200/50 backdrop-blur-sm shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Original</span>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-100'}`}>
                  <FileJson className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="font-mono text-2xl font-bold"
                  title={`Calculated using ${getEncodingName()}`}
                >
                  {stats.inputTokens} tokens
                </div>
                <div className="text-sm text-zinc-300">
                  {stats.inputSize} B
                </div>
              </div>
            </div>

            {/* Optimized Size Card */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50 backdrop-blur-sm' : 'bg-white/80 border-zinc-200/50 backdrop-blur-sm shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-300">Optimized</span>
                <div className={`p-2 rounded-lg ${parseFloat(stats.tokenSavings) > 0 ? 'bg-teal-500/20' : parseFloat(stats.tokenSavings) < 0 ? 'bg-red-500/20' : 'bg-teal-500/20'}`}>
                  <Zap className={`w-4 h-4 ${parseFloat(stats.tokenSavings) > 0 ? 'text-teal-500' : parseFloat(stats.tokenSavings) < 0 ? 'text-red-500' : 'text-teal-500'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className={`font-mono text-2xl font-bold ${parseFloat(stats.tokenSavings) > 0 ? 'text-teal-600 dark:text-teal-400' : parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}
                  title={`Calculated using ${getEncodingName()}`}
                >
                  {stats.outputTokens} tokens
                </div>
                <div className="text-sm text-zinc-300">
                  {stats.outputSize} B
                </div>
              </div>
            </div>

            {/* Savings Card */}
            <div className={`p-6 rounded-xl border ${parseFloat(stats.tokenSavings) > 0 ? 
              (isDark ? 'bg-teal-900/20 border-teal-700/50 backdrop-blur-sm' : 'bg-teal-50/80 border-teal-200/50 backdrop-blur-sm shadow-sm') :
              parseFloat(stats.tokenSavings) < 0 ?
              (isDark ? 'bg-red-900/20 border-red-700/50 backdrop-blur-sm animate-pulse-error' : 'bg-red-50/80 border-red-200/50 backdrop-blur-sm shadow-sm animate-pulse-error') :
              (isDark ? 'bg-teal-900/20 border-teal-700/50 backdrop-blur-sm' : 'bg-teal-50/80 border-teal-200/50 backdrop-blur-sm shadow-sm')
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-teal-700 dark:text-teal-300' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-700 dark:text-red-300' :
                  'text-teal-700 dark:text-teal-300'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? 'Savings' : parseFloat(stats.tokenSavings) < 0 ? 'Increase' : 'Optimal'}
                  <Info className="w-3 h-3" />
                </span>
                <div className={`p-2 rounded-lg ${
                  parseFloat(stats.tokenSavings) > 0 ? 'bg-teal-500/20' :
                  parseFloat(stats.tokenSavings) < 0 ? 'bg-red-500/20' : 'bg-teal-500/20'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  ) : parseFloat(stats.tokenSavings) < 0 ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Info className="w-4 h-4 text-teal-500" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className={`font-mono text-2xl font-bold animate-slide-in-up ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-teal-600 dark:text-teal-400' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? '+' : ''}{stats.tokenSavings}%
                </div>
                <div className={`text-sm ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-teal-600 dark:text-teal-400' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-teal-600 dark:text-teal-400'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? 'Tokens saved' :
                   parseFloat(stats.tokenSavings) < 0 ? 'Token overhead' : 'No optimization needed'}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="p-4 rounded-lg border bg-zinc-700/20 border-zinc-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Compression Analysis</span>
                <span className="text-[10px] text-zinc-400">Using {getEncodingName()}</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {stats.inputTokens} → {stats.outputTokens} tokens
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Circular Progress */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#374151"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={parseFloat(stats.tokenSavings) > 0 ? '#14b8a6' : parseFloat(stats.tokenSavings) < 0 ? '#ef4444' : '#71717a'}
                    strokeWidth="6"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.abs(parseFloat(stats.tokenSavings)) / 100)}`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold ${
                    parseFloat(stats.tokenSavings) > 0 ? 'text-teal-600 dark:text-teal-400' :
                    parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-600'
                  }`}>
                    {Math.abs(parseFloat(stats.tokenSavings))}%
                  </span>
                </div>
              </div>
              
              {/* Linear Progress */}
              <div className="flex-1">
                <div className="relative">
                  <div className="h-4 rounded-full overflow-hidden bg-zinc-600">
                    <div 
                      className={`h-full transition-all duration-700 ease-out progress-bar-glow ${
                        parseFloat(stats.tokenSavings) > 0 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' :
                        parseFloat(stats.tokenSavings) < 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                        'bg-gradient-to-r from-zinc-400 to-zinc-500'
                      }`}
                      style={{ 
                        width: `${Math.max(Math.min((stats.outputTokens / stats.inputTokens) * 100, 100), 0)}%`
                      }}
                    />
                  </div>
                  {/* Size comparison labels */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-zinc-400">0%</span>
                    <span className={`font-semibold ${
                      parseFloat(stats.tokenSavings) > 0 ? 'text-teal-600 dark:text-teal-400' :
                      parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' :
                      (isDark ? 'text-zinc-400' : 'text-zinc-600')
                    }`}>
                      {((stats.outputTokens / stats.inputTokens) * 100).toFixed(1)}% of original
                    </span>
                    <span className="text-zinc-400">100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Message */}
            {input.trim() && output && !error && (
              <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                parseFloat(stats.tokenSavings) > 0 ? 
                (isDark ? 'bg-teal-900/20 border-teal-500 text-teal-200' : 'bg-teal-50 border-teal-500 text-teal-800') :
                parseFloat(stats.tokenSavings) < 0 ?
                (isDark ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-red-50 border-red-500 text-red-800') :
                (isDark ? 'bg-teal-900/20 border-teal-500 text-teal-200' : 'bg-teal-50 border-teal-500 text-teal-800')
              }`}>
                <p className="text-sm font-medium">
                  {parseFloat(stats.tokenSavings) > 0 ? (
                    `✅ Successfully compressed! You'll save ${Math.abs(parseFloat(stats.tokenSavings))}% on LLM API costs.`
                  ) : parseFloat(stats.tokenSavings) < 0 ? (
                    `⚠️ Compression increased size by ${Math.abs(parseFloat(stats.tokenSavings))}%. Original data may already be optimized.`
                  ) : (
                    `ℹ️ No optimization needed. The JSON is already small or optimally structured for token usage.`
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="max-w-[1600px] mx-auto px-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-0.5 rounded-lg border bg-zinc-700 border-zinc-600">
                <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-white hover:shadow-sm'}`}>
                  <input 
                    id="aggressive-checkbox"
                    type="checkbox" 
                    checked={options.aggressive}
                    onChange={(e) => setOptions({ ...options, aggressive: e.target.checked })}
                    className={`w-3 h-3 rounded transition-all ${isDark ? 'border-zinc-400 bg-zinc-700 text-teal-400 focus:ring-teal-400 focus:ring-offset-zinc-800' : 'border-zinc-500 bg-white text-teal-600 focus:ring-teal-500 focus:ring-offset-white'} focus:ring-2 focus:ring-offset-2`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-zinc-200 group-hover:text-teal-300' : 'text-zinc-700 group-hover:text-teal-700'}`}>Aggressive</span>
                </label>
                <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-white hover:shadow-sm'}`}>
                  <input 
                    id="unsafe-checkbox"
                    type="checkbox" 
                    checked={options.unsafe}
                    onChange={(e) => setOptions({ ...options, unsafe: e.target.checked })}
                    className={`w-3 h-3 rounded transition-all ${isDark ? 'border-zinc-400 bg-zinc-700 text-teal-400 focus:ring-teal-400 focus:ring-offset-zinc-800' : 'border-zinc-500 bg-white text-teal-600 focus:ring-teal-500 focus:ring-offset-white'} focus:ring-2 focus:ring-offset-2`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-zinc-200 group-hover:text-teal-300' : 'text-zinc-700 group-hover:text-teal-700'}`}>Unsafe</span>
                </label>
              </div>
              <div className={`w-px h-5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <button 
                onClick={handleVerify}
                className="flex items-center gap-1.5 text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-3 h-3" />
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Pane Layout */}
      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        {/* Mobile Tabs */}
        <div className="flex md:hidden mb-4 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'input' ? 'bg-white dark:bg-zinc-800 shadow-sm text-teal-600' : 'text-zinc-500'}`}
          >
            INPUT
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'output' ? 'bg-white dark:bg-zinc-800 shadow-sm text-teal-600' : 'text-zinc-500'}`}
          >
            OUTPUT
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[500px]">
          {/* Input Pane */}
          <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden transition-all ${activeTab === 'input' ? 'flex' : 'hidden md:flex'} bg-zinc-700 border-zinc-600`}>
            <div className={`shrink-0 px-5 py-3 border-b flex items-center justify-between ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50/50 border-zinc-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-teal-500/10">
                  <FileJson className="w-4 h-4 text-teal-500" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Input JSON</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleLoadSample} className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[10px] font-bold transition-all">SAMPLE</button>
                <button onClick={handleLoadLargeSample} className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[10px] font-bold transition-all">LARGE</button>
                <button onClick={handleFormat} className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[10px] font-bold transition-all">FORMAT</button>
                <div className={`w-px h-4 mx-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <button onClick={handleClear} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all" title="Clear"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative depth-recessed">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <div className="editor-container">
                  {renderLineNumbers(input, error?.line)}
                  <Editor
                    value={input}
                    onValueChange={code => setInput(code)}
                    onPaste={handlePaste}
                    highlight={code => highlightWithErrors(code, error?.line)}
                    padding={24}
                    className="flex-1 focus:outline-none"
                    textareaId="input-json-editor"
                    style={{
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      fontSize: 13,
                      lineHeight: '1.6',
                      backgroundColor: 'transparent',
                      color: isDark ? '#d4d4d8' : '#3f3f46',
                    }}
                  />
                </div>
              </div>
              {error && (
                <div className="absolute bottom-6 left-6 right-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl backdrop-blur-xl flex items-start gap-4 z-20 shadow-2xl animate-fade-in-up">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black uppercase tracking-wider mb-1">Syntax Error</p>
                    <p className="font-medium opacity-90">{error.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Output Pane */}
          <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden transition-all ${activeTab === 'output' ? 'flex' : 'hidden md:flex'} bg-zinc-700 border-zinc-600`}>
            <div className={`shrink-0 px-5 py-3 border-b flex items-center justify-between ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50/50 border-zinc-200'}`}>
              <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                <button 
                  onClick={() => setOutputMode('optimized')}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    outputMode === 'optimized' 
                      ? 'bg-white dark:bg-zinc-800 shadow-sm text-teal-600' 
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  OPTIMIZED
                </button>
                <button 
                  onClick={() => setOutputMode('restored')}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    outputMode === 'restored' 
                      ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600' 
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  RESTORED
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" title="Download"><Download className="w-4 h-4" /></button>
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all" title="Copy"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative depth-recessed">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <div className="editor-container">
                  {renderLineNumbers(outputMode === 'optimized' ? output : restored)}
                  <Editor
                    value={outputMode === 'optimized' ? output : restored}
                    onValueChange={() => {}}
                    highlight={code => highlight(code, languages.json, 'json')}
                    padding={24}
                    readOnly
                    className="flex-1"
                    textareaId="output-json-editor"
                    style={{
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      fontSize: 13,
                      lineHeight: '1.6',
                      backgroundColor: 'transparent',
                      color: isDark ? '#d4d4d8' : '#3f3f46',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Documentation Section */}
      <div className="border-t border-zinc-600 bg-zinc-800/50">
        <div className="max-w-[1600px] mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Introduction & Features */}
            <div className="space-y-10">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-3 rounded-2xl depth-elevated">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{docData.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={docData.badges.npm} alt="NPM Version" className="h-5" />
                      <img src={docData.badges.license} alt="License" className="h-5" />
                    </div>
                  </div>
                </div>
                <p className={`text-xl font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {docData.description}
                </p>
              </div>

              {/* Package Metadata */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                  <div className="w-8 h-px bg-teal-500/30" />
                  Package Intelligence
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl border depth-elevated ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Version</span>
                    </div>
                    <div className="text-xl font-black text-teal-500">
                      v{docData.metadata.version}
                    </div>
                  </div>
                  
                  <div className={`p-5 rounded-2xl border depth-elevated ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>License</span>
                    </div>
                    <div className="text-xl font-black text-emerald-500">
                      {docData.metadata.license}
                    </div>
                  </div>
                </div>
                
                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  <a 
                    href={docData.metadata.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all depth-elevated ${
                      isDark 
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-teal-500 hover:text-teal-400' 
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-500 hover:text-teal-600'
                    }`}
                  >
                    Homepage
                  </a>
                  <a 
                    href={`https://www.npmjs.com/package/llm-chat-msg-compressor`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all depth-elevated ${
                      isDark 
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-red-400' 
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-red-500 hover:text-red-600'
                    }`}
                  >
                    NPM Registry
                  </a>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                  <div className="w-8 h-px bg-teal-500/30" />
                  Core Capabilities
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {docData.sections.features.map((feature, index) => (
                    <div key={index} className={`flex items-start gap-5 p-5 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-white border-zinc-200/50 shadow-sm'}`}>
                      <span className="text-2xl p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">{feature.icon}</span>
                      <div>
                        <p className="font-black text-sm mb-1">{feature.title}</p>
                        <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Installation & Usage */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                  <div className="w-8 h-px bg-teal-500/30" />
                  Quick Start
                </h3>
                <div className="group relative">
                  <button
                    onClick={() => handleCopySection('installation', docData.sections.installation.command)}
                    className={`absolute top-4 right-4 p-2 rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 depth-elevated ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-50 text-zinc-500 border'
                    }`}
                  >
                    {copiedId === 'installation' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div className={`p-6 rounded-2xl border depth-recessed ${isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-100 border-zinc-200'}`}>
                    <code className={`font-mono text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {docData.sections.installation.command}
                    </code>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                  <div className="w-8 h-px bg-teal-500/30" />
                  Implementation
                </h3>
                <div className="group relative">
                  <button
                    onClick={() => handleCopySection('usage', docData.sections.usage.code)}
                    className={`absolute top-4 right-4 p-2 rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 depth-elevated ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-50 text-zinc-500 border'
                    }`}
                  >
                    {copiedId === 'usage' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div className={`p-6 rounded-2xl border depth-recessed ${isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-100 border-zinc-200'} overflow-x-auto`}>
                    <pre className={`font-mono text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
{docData.sections.usage.code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategies & Options */}
          <div className="mt-24 space-y-20">
            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                <div className="w-8 h-px bg-teal-500/30" />
                Compression Strategies
              </h3>
              <p className={`text-lg font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                The library <span className="text-teal-500 font-black">automatically selects</span> the best strategy using a smart scoring algorithm:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docData.sections.strategies.map((strategy, index) => {
                  const colorMap: Record<string, string> = {
                    blue: 'text-teal-500',
                    purple: 'text-purple-500',
                    green: 'text-emerald-500',
                    orange: 'text-amber-500',
                  };
                  const colorClass = colorMap[strategy.color] || 'text-zinc-500';
                  
                  return (
                    <div key={index} className={`p-8 rounded-2xl border depth-elevated transition-all hover:scale-[1.02] ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-white border-zinc-200 shadow-sm'}`}>
                      <h4 className={`font-black text-lg mb-3 flex items-center gap-3 ${colorClass}`}>
                        <span className="text-2xl">{strategy.icon}</span>
                        {strategy.title}
                      </h4>
                      <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {strategy.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                <div className="w-8 h-px bg-teal-500/30" />
                Configuration Options
              </h3>
              <div className="group relative">
                <button
                  onClick={() => handleCopySection('options', docData.sections.options.code)}
                  className={`absolute top-4 right-4 p-2 rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 depth-elevated ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-50 text-zinc-500 border'
                  }`}
                >
                  {copiedId === 'options' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className={`p-8 rounded-2xl border depth-recessed ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                  <pre className={`font-mono text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
{docData.sections.options.code}
                  </pre>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                <div className="w-8 h-px bg-teal-500/30" />
                Safety & Integrity
              </h3>
              <div className={`p-8 rounded-2xl border-l-4 border-teal-500 depth-elevated ${isDark ? 'bg-teal-500/5 border-teal-500/30' : 'bg-teal-50 border-teal-500/30'}`}>
                <p className={`text-lg font-medium leading-relaxed ${isDark ? 'text-teal-200' : 'text-teal-900'}`}>
                  {docData.sections.safety.content}
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-teal-500 flex items-center gap-3">
                <div className="w-8 h-px bg-teal-500/30" />
                Performance Benchmarks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {docData.sections.performance.map((feature, index) => (
                  <div key={index} className={`p-6 rounded-2xl depth-elevated border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <h4 className="font-black text-sm mb-3 text-teal-500">{feature.title}</h4>
                    <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 py-8 px-4 border-t border-zinc-600 bg-zinc-800 text-zinc-400">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">© 2025 LLM Compressor Engine</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Sridharvn/llm-chat-msg-compressor" target="_blank" rel="noopener" className="text-[10px] font-black uppercase tracking-widest hover:text-teal-500 transition-colors">Documentation</a>
            <a href="https://www.npmjs.com/package/llm-chat-msg-compressor" target="_blank" rel="noopener" className="text-[10px] font-black uppercase tracking-widest hover:text-teal-500 transition-colors">NPM Registry</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
