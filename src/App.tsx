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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('llm-compressor-theme');
    return saved ? saved === 'dark' : true;
  });
  // @ts-expect-error - activeTab and setActiveTab are planned for mobile tab implementation
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
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
    localStorage.setItem('llm-compressor-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
            background: isDark ? '#1f2937' : '#fff',
            color: isDark ? '#fff' : '#1f2937',
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
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#fff' : '#1f2937',
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
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#fff' : '#1f2937',
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className={`shrink-0 border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'} backdrop-blur-md z-10`}>
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">LLM Compressor</h1>
              <div className="flex items-center gap-2">
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{docData.title}</p>
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
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://www.npmjs.com/package/llm-chat-msg-compressor" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
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
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Stats Display */}
      <div className={`shrink-0 border-b ${isDark ? 'border-gray-800 bg-gradient-to-r from-gray-900/40 via-gray-900/30 to-gray-900/40' : 'border-gray-100 bg-gradient-to-r from-gray-50/80 via-white/60 to-gray-50/80'}`}>
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Original Size Card */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Original</span>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <FileJson className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-2xl font-bold">{stats.inputSize} B</div>
                <div 
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  title={`Calculated using ${getEncodingName()}`}
                >
                  {stats.inputTokens} tokens
                </div>
              </div>
            </div>

            {/* Optimized Size Card */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Optimized</span>
                <div className={`p-2 rounded-lg ${parseFloat(stats.tokenSavings) > 0 ? 'bg-green-500/20' : parseFloat(stats.tokenSavings) < 0 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                  <Zap className={`w-4 h-4 ${parseFloat(stats.tokenSavings) > 0 ? 'text-green-500' : parseFloat(stats.tokenSavings) < 0 ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <div className={`font-mono text-2xl font-bold ${parseFloat(stats.tokenSavings) > 0 ? 'text-green-600 dark:text-green-400' : parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{stats.outputSize} B</div>
                <div 
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  title={`Calculated using ${getEncodingName()}`}
                >
                  {stats.outputTokens} tokens
                </div>
              </div>
            </div>

            {/* Savings Card */}
            <div className={`p-6 rounded-xl border ${parseFloat(stats.tokenSavings) > 0 ? 
              (isDark ? 'bg-green-900/20 border-green-700/50 backdrop-blur-sm' : 'bg-green-50/80 border-green-200/50 backdrop-blur-sm shadow-sm') :
              parseFloat(stats.tokenSavings) < 0 ?
              (isDark ? 'bg-red-900/20 border-red-700/50 backdrop-blur-sm animate-pulse-error' : 'bg-red-50/80 border-red-200/50 backdrop-blur-sm shadow-sm animate-pulse-error') :
              (isDark ? 'bg-blue-900/20 border-blue-700/50 backdrop-blur-sm' : 'bg-blue-50/80 border-blue-200/50 backdrop-blur-sm shadow-sm')
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-green-700 dark:text-green-300' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-700 dark:text-red-300' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? 'Savings' : parseFloat(stats.tokenSavings) < 0 ? 'Increase' : 'Optimal'}
                  <Info className="w-3 h-3" />
                </span>
                <div className={`p-2 rounded-lg ${
                  parseFloat(stats.tokenSavings) > 0 ? 'bg-green-500/20' :
                  parseFloat(stats.tokenSavings) < 0 ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : parseFloat(stats.tokenSavings) < 0 ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className={`font-mono text-2xl font-bold animate-slide-in-up ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-green-600 dark:text-green-400' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? '+' : ''}{stats.tokenSavings}%
                </div>
                <div className={`text-sm ${
                  parseFloat(stats.tokenSavings) > 0 ? 'text-green-600 dark:text-green-400' :
                  parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {parseFloat(stats.tokenSavings) > 0 ? 'Tokens saved' :
                   parseFloat(stats.tokenSavings) < 0 ? 'Token overhead' : 'No optimization needed'}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800/20 border-gray-700/30' : 'bg-gray-50/50 border-gray-200/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Compression Analysis</span>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Using {getEncodingName()}</span>
              </div>
              <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                    stroke={isDark ? '#374151' : '#e5e7eb'}
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={parseFloat(stats.tokenSavings) > 0 ? '#10b981' : parseFloat(stats.tokenSavings) < 0 ? '#ef4444' : '#6b7280'}
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
                    parseFloat(stats.tokenSavings) > 0 ? 'text-green-600 dark:text-green-400' :
                    parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600'
                  }`}>
                    {Math.abs(parseFloat(stats.tokenSavings))}%
                  </span>
                </div>
              </div>
              
              {/* Linear Progress */}
              <div className="flex-1">
                <div className="relative">
                  <div className={`h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full transition-all duration-700 ease-out progress-bar-glow ${
                        parseFloat(stats.tokenSavings) > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        parseFloat(stats.tokenSavings) < 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ 
                        width: `${Math.max(Math.min((stats.outputTokens / stats.inputTokens) * 100, 100), 0)}%`
                      }}
                    />
                  </div>
                  {/* Size comparison labels */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>0%</span>
                    <span className={`font-semibold ${
                      parseFloat(stats.tokenSavings) > 0 ? 'text-green-600 dark:text-green-400' :
                      parseFloat(stats.tokenSavings) < 0 ? 'text-red-600 dark:text-red-400' :
                      (isDark ? 'text-gray-400' : 'text-gray-600')
                    }`}>
                      {((stats.outputTokens / stats.inputTokens) * 100).toFixed(1)}% of original
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Message */}
            {input.trim() && output && !error && (
              <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                parseFloat(stats.tokenSavings) > 0 ? 
                (isDark ? 'bg-green-900/20 border-green-500 text-green-200' : 'bg-green-50 border-green-500 text-green-800') :
                parseFloat(stats.tokenSavings) < 0 ?
                (isDark ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-red-50 border-red-500 text-red-800') :
                (isDark ? 'bg-blue-900/20 border-blue-500 text-blue-200' : 'bg-blue-50 border-blue-500 text-blue-800')
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
              <div className={`flex items-center gap-2 p-0.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-sm'}`}>
                  <input 
                    id="aggressive-checkbox"
                    type="checkbox" 
                    checked={options.aggressive}
                    onChange={(e) => setOptions({ ...options, aggressive: e.target.checked })}
                    className={`w-3 h-3 rounded transition-all ${isDark ? 'border-gray-400 bg-gray-700 text-blue-400 focus:ring-blue-400 focus:ring-offset-gray-800' : 'border-gray-500 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white'} focus:ring-2 focus:ring-offset-2`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-gray-200 group-hover:text-blue-300' : 'text-gray-700 group-hover:text-blue-700'}`}>Aggressive</span>
                </label>
                <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-sm'}`}>
                  <input 
                    id="unsafe-checkbox"
                    type="checkbox" 
                    checked={options.unsafe}
                    onChange={(e) => setOptions({ ...options, unsafe: e.target.checked })}
                    className={`w-3 h-3 rounded transition-all ${isDark ? 'border-gray-400 bg-gray-700 text-blue-400 focus:ring-blue-400 focus:ring-offset-gray-800' : 'border-gray-500 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white'} focus:ring-2 focus:ring-offset-2`}
                  />
                  <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-gray-200 group-hover:text-blue-300' : 'text-gray-700 group-hover:text-blue-700'}`}>Unsafe</span>
                </label>
              </div>
              <div className={`w-px h-5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <button 
                onClick={handleVerify}
                className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-3 h-3" />
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Pane Layout */}
      <main className="flex-1 flex flex-col min-h-[60vh] p-2 md:p-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 min-h-[50vh] max-w-[1600px] mx-auto w-full">
          
          {/* Input Pane */}
          <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className={`shrink-0 px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Input JSON</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleLoadSample} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">SAMPLE</button>
                <button onClick={handleLoadLargeSample} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">LARGE</button>
                <button onClick={handleFormat} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">FORMAT</button>
                <div className="w-px h-4 mx-1 bg-gray-300 dark:bg-gray-700" />
                <button onClick={handleClear} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Clear"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <div className="editor-container">
                  {renderLineNumbers(input, error?.line)}
                  <Editor
                    value={input}
                    onValueChange={code => setInput(code)}
                    onPaste={handlePaste}
                    highlight={code => highlightWithErrors(code, error?.line)}
                    padding={20}
                    className="flex-1 focus:outline-none"
                    textareaId="input-json-editor"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: 13,
                      lineHeight: '1.5',
                      backgroundColor: 'transparent',
                      color: isDark ? '#e5e7eb' : '#374151',
                    }}
                  />
                </div>
              </div>
              {error && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg backdrop-blur-md flex items-start gap-3 z-20 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Invalid JSON</p>
                    <p className="opacity-90">{error.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Output Pane */}
          <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className={`shrink-0 px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`flex p-1 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                <button 
                  onClick={() => setOutputMode('optimized')}
                  className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${
                    outputMode === 'optimized' 
                      ? `${isDark ? 'bg-gray-700 text-blue-400 shadow-sm border border-blue-500/30' : 'bg-white text-blue-600 shadow-sm border border-blue-200'}` 
                      : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200/50'}`
                  }`}
                >
                  OPTIMIZED
                </button>
                <button 
                  onClick={() => setOutputMode('restored')}
                  className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${
                    outputMode === 'restored' 
                      ? `${isDark ? 'bg-gray-700 text-emerald-400 shadow-sm border border-emerald-500/30' : 'bg-white text-emerald-600 shadow-sm border border-emerald-200'}` 
                      : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200/50'}`
                  }`}
                >
                  RESTORED
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                <button onClick={handleCopy} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <div className="editor-container">
                  {renderLineNumbers(outputMode === 'optimized' ? output : restored)}
                  <Editor
                    value={outputMode === 'optimized' ? output : restored}
                    onValueChange={() => {}}
                    highlight={code => highlight(code, languages.json, 'json')}
                    padding={20}
                    readOnly
                    className="flex-1"
                    textareaId="output-json-editor"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: 13,
                      lineHeight: '1.5',
                      backgroundColor: 'transparent',
                      color: isDark ? '#d1d5db' : '#4b5563',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Documentation Section */}
      <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-950/50' : 'border-gray-200 bg-gray-50/50'}`}>
        <div className="max-w-[1600px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Introduction & Features */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{docData.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <img src={docData.badges.npm} alt="NPM Version" className="h-4" />
                      <img src={docData.badges.license} alt="License" className="h-4" />
                      <img src={docData.badges.build} alt="Build Status" className="h-4" />
                    </div>
                  </div>
                </div>
                <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {docData.description}
                </p>
              </div>

              {/* Package Metadata */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Package Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">📦</span>
                      <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Version</span>
                    </div>
                    <div className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                      v{docData.metadata.version}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">⚖️</span>
                      <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>License</span>
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {docData.metadata.license}
                    </div>
                  </div>
                  
                  {docData.metadata.downloads && (
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">📈</span>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Weekly Downloads</span>
                      </div>
                      <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {docData.metadata.downloads.weekly.toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {docData.metadata.size && (
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">💾</span>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Package Size</span>
                      </div>
                      <div className="font-semibold text-orange-600 dark:text-orange-400">
                        {docData.metadata.size}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Links */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a 
                    href={docData.metadata.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isDark 
                        ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-600 hover:text-blue-400' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600'
                    }`}
                  >
                    <span>🏠</span> Homepage
                  </a>
                  <a 
                    href={docData.metadata.repository.url.replace('git+', '').replace('.git', '')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isDark 
                        ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-green-600 hover:text-green-400' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:text-green-600'
                    }`}
                  >
                    <span>📁</span> Repository
                  </a>
                  <a 
                    href={`https://www.npmjs.com/package/llm-chat-msg-compressor`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isDark 
                        ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-red-600 hover:text-red-400' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-600'
                    }`}
                  >
                    <span>📦</span> NPM Package
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Features
                </h3>
                <div className="space-y-3">
                  {docData.sections.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-lg">{feature.icon}</span>
                      <div>
                        <p className="font-semibold">{feature.title}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Installation & Usage */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Installation
                </h3>
                <div className="group relative">
                  <button
                    onClick={() => handleCopySection('installation', docData.sections.installation.command)}
                    className={`absolute top-3 right-3 p-1.5 rounded-md transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 ${
                      isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-500 shadow-sm border'
                    }`}
                    title="Copy command"
                  >
                    {copiedId === 'installation' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                    <code className={`font-mono text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      {docData.sections.installation.command}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  Usage
                </h3>
                <div className="group relative">
                  <button
                    onClick={() => handleCopySection('usage', docData.sections.usage.code)}
                    className={`absolute top-3 right-3 p-1.5 rounded-md transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 ${
                      isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-500 shadow-sm border'
                    }`}
                    title="Copy code"
                  >
                    {copiedId === 'usage' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'} overflow-x-auto`}>
                    <pre className={`font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
{docData.sections.usage.code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategies & Options */}
          <div className="mt-16 space-y-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Compression Strategies
              </h3>
              <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                The library <strong>automatically selects</strong> the best strategy using a smart scoring algorithm:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docData.sections.strategies.map((strategy, index) => {
                  const colorMap: Record<string, string> = {
                    blue: 'text-blue-600 dark:text-blue-400',
                    purple: 'text-purple-600 dark:text-purple-400',
                    green: 'text-green-600 dark:text-green-400',
                    orange: 'text-orange-600 dark:text-orange-400',
                  };
                  const colorClass = colorMap[strategy.color] || 'text-gray-600 dark:text-gray-400';
                  
                  return (
                    <div key={index} className={`p-6 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                      <h4 className={`font-bold text-lg mb-2 ${colorClass}`}>{strategy.icon} {strategy.title}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {strategy.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                Configuration Options
              </h3>
              <div className="group relative">
                <button
                  onClick={() => handleCopySection('options', docData.sections.options.code)}
                  className={`absolute top-3 right-3 p-1.5 rounded-md transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-20 ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-500 shadow-sm border'
                  }`}
                  title="Copy options"
                >
                  {copiedId === 'options' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                  <pre className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
{docData.sections.options.code}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                {docData.sections.safety.title}
              </h3>
              <div className={`p-6 rounded-lg border-l-4 border-blue-500 ${isDark ? 'bg-blue-950/20 border-blue-400' : 'bg-blue-50 border-blue-500'}`}>
                <p className={`${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  {docData.sections.safety.content}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                Performance
              </h3>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Designed for high-throughput environments:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {docData.sections.performance.map((feature, index) => {
                  const colorMap: Record<string, string> = {
                    '⚡': 'text-blue-600 dark:text-blue-400',
                    '🎯': 'text-green-600 dark:text-green-400',
                    '📊': 'text-purple-600 dark:text-purple-400',
                  };
                  const colorClass = colorMap[feature.icon] || 'text-gray-600 dark:text-gray-400';
                  
                  return (
                    <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-2 ${colorClass}`}>{feature.title}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`shrink-0 py-2 px-4 border-t ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-[10px]">
          <p>© 2025 LLM Compressor</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Sridharvn/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
