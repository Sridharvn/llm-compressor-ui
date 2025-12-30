import { useState, useEffect, useMemo } from 'react';
import { optimize, restore } from 'llm-chat-msg-compressor';
import debounce from 'lodash.debounce';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { 
  Zap, 
  RefreshCw, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Moon, 
  Sun, 
  FileJson,
  ExternalLink,
  Github,
  Eye,
  EyeOff,
  Info,
  Download
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [error, setError] = useState<{ message: string; line?: number } | null>(null);

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
    
    // Heuristic token estimation (1 token ≈ 4 chars)
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
  const handleCopy = async () => {
    const textToCopy = outputMode === 'optimized' ? output : restored;
    try {
      await navigator.clipboard.writeText(textToCopy);
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

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
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
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>llm-chat-msg-compressor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

      {/* Stats & Controls Bar */}
      <div className={`shrink-0 border-b ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-50">Original</span>
              <span className="font-mono text-xs">{stats.inputSize} B <span className="opacity-40 text-[9px]">({stats.inputTokens} tokens)</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-50">Optimized</span>
              <span className="font-mono text-xs text-blue-500">{stats.outputSize} B <span className="opacity-40 text-[9px]">({stats.outputTokens} tokens)</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-50 flex items-center gap-1">
                Savings <Info className="w-2 h-2" />
              </span>
              <span className={`font-bold text-xs ${parseFloat(stats.tokenSavings) > 0 ? 'text-green-500' : parseFloat(stats.tokenSavings) < 0 ? 'text-red-500' : ''}`}>
                {parseFloat(stats.tokenSavings) > 0 ? '+' : ''}{stats.tokenSavings}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-200/50 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-all">
                <input 
                  type="checkbox" 
                  checked={options.aggressive}
                  onChange={(e) => setOptions({ ...options, aggressive: e.target.checked })}
                  className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[10px] font-semibold group-hover:text-blue-500 transition-colors">Aggressive</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-all">
                <input 
                  type="checkbox" 
                  checked={options.unsafe}
                  onChange={(e) => setOptions({ ...options, unsafe: e.target.checked })}
                  className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[10px] font-semibold group-hover:text-blue-500 transition-colors">Unsafe</span>
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

      {/* Main Content - 2 Pane Layout */}
      <main className="flex-1 flex flex-col min-h-0 p-2 md:p-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 min-h-0 max-w-[1600px] mx-auto w-full">
          
          {/* Input Pane */}
          <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className={`shrink-0 px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Input JSON</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleLoadSample} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">SAMPLE</button>
                <button onClick={handleLoadLargeSample} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">LARGE</button>
                <button onClick={handleFormat} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">FORMAT</button>
                <div className="w-px h-4 mx-1 bg-gray-300 dark:bg-gray-700" />
                <button onClick={handleClear} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Clear"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-white dark:bg-gray-950">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <Editor
                  value={input}
                  onValueChange={code => setInput(code)}
                  highlight={code => highlight(code, languages.json, 'json')}
                  padding={20}
                  className="min-h-full focus:outline-none"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 13,
                    lineHeight: '1.5',
                  }}
                />
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
              <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                  onClick={() => setOutputMode('optimized')}
                  className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${outputMode === 'optimized' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'opacity-50 hover:opacity-80'}`}
                >
                  OPTIMIZED
                </button>
                <button 
                  onClick={() => setOutputMode('restored')}
                  className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${outputMode === 'restored' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'opacity-50 hover:opacity-80'}`}
                >
                  RESTORED
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                <button onClick={handleCopy} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-gray-50/50 dark:bg-gray-900/50">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                <Editor
                  value={outputMode === 'optimized' ? output : restored}
                  onValueChange={() => {}}
                  highlight={code => highlight(code, languages.json, 'json')}
                  padding={20}
                  readOnly
                  className="min-h-full"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 13,
                    lineHeight: '1.5',
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`shrink-0 py-2 px-4 border-t ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-[10px]">
          <p>© 2025 LLM Compressor</p>
          <div className="flex items-center gap-4">
            <a href="https://www.npmjs.com/package/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500">NPM</a>
            <a href="https://github.com/Sridharvn/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
