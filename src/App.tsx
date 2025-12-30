import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Github
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
  const runOptimization = useCallback(
    debounce((val: string, opts: Options) => {
      if (!val.trim()) {
        setOutput('');
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
        setError(null);
      } catch (e: any) {
        const match = e.message.match(/at line (\d+)/);
        setError({
          message: e.message,
          line: match ? parseInt(match[1]) : undefined
        });
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
    const outputSize = new Blob([output]).size;
    const savings = inputSize > 0 ? ((inputSize - outputSize) / inputSize) * 100 : 0;
    return {
      inputSize,
      outputSize,
      savings: Math.max(0, savings).toFixed(1)
    };
  }, [input, output]);

  // Handlers
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard!', {
        style: {
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#fff' : '#1f2937',
        },
      });
    } catch (err) {
      toast.error('Failed to copy');
    }
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
    } catch (e) {
      toast.error('Verification Error: Invalid JSON');
    }
  };

  const handleClear = () => {
    setInput('');
    toast('Workspace cleared', { icon: '🗑️' });
  };

  const handleLoadSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    toast.success('Sample data loaded');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">LLM Compressor UI</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Powered by llm-chat-msg-compressor</p>
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
              <Github className="w-5 h-5" />
            </a>
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Stats & Controls Bar */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">Original</span>
              <span className="font-mono text-sm">{stats.inputSize} B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">Optimized</span>
              <span className="font-mono text-sm text-blue-500">{stats.outputSize} B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">Savings</span>
              <span className={`font-bold text-sm ${parseFloat(stats.savings) > 0 ? 'text-green-500' : ''}`}>
                {stats.savings}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={options.aggressive}
                onChange={(e) => setOptions({ ...options, aggressive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">Aggressive</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={options.unsafe}
                onChange={(e) => setOptions({ ...options, unsafe: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">Unsafe</span>
            </label>
            <div className={`w-px h-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <button 
              onClick={handleVerify}
              className="flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify Restore
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 gap-4 overflow-hidden">
        
        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'input' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
          >
            Input JSON
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'output' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
          >
            Optimized
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          
          {/* Input Pane */}
          <div className={`flex flex-col rounded-xl border overflow-hidden transition-all ${activeTab !== 'input' ? 'hidden md:flex' : 'flex'} ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Input JSON</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleLoadSample}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium flex items-center gap-1"
                  title="Load Sample"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sample
                </button>
                <button 
                  onClick={handleClear}
                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  title="Clear Workspace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto relative font-mono text-sm">
              <Editor
                value={input}
                onValueChange={code => setInput(code)}
                highlight={code => highlight(code, languages.json, 'json')}
                padding={20}
                className="min-h-full focus:outline-none"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                }}
              />
              {error && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg backdrop-blur-sm flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
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
          <div className={`flex flex-col rounded-xl border overflow-hidden transition-all ${activeTab !== 'output' ? 'hidden md:flex' : 'flex'} ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Optimized Output</span>
              </div>
              <button 
                onClick={handleCopy}
                disabled={!output}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-30"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-sm bg-gray-50/50 dark:bg-gray-950/50">
              <Editor
                value={output}
                onValueChange={() => {}}
                highlight={code => highlight(code, languages.json, 'json')}
                padding={20}
                readOnly
                className="min-h-full"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 px-4 border-t ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2025 LLM Compressor UI. Built for efficiency.</p>
          <div className="flex items-center gap-6">
            <a href="https://www.npmjs.com/package/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500 flex items-center gap-1">
              NPM Package <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://github.com/Sridharvn/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500 flex items-center gap-1">
              Documentation <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
