import { FileJson, Trash2, AlertCircle, Download, Copy } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import toast from 'react-hot-toast';
import { useCompression } from '@/providers/CompressionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { SAMPLE_JSON, LARGE_SAMPLE_JSON } from '@/constants';

export function EditorPane() {
  const { 
    input, setInput, output, restored, error, handleClear, 
    outputMode, setOutputMode 
  } = useCompression();
  const { isDark } = useTheme();

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
    if (!textToCopy) return;
    
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

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 min-h-[50vh] max-w-[1600px] mx-auto w-full">
      {/* Input Pane */}
      <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg'}`}>
        <div className={`shrink-0 px-4 py-2 border-b flex items-center justify-between ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-blue-500" />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Input JSON</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setInput(JSON.stringify(SAMPLE_JSON, null, 2))} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">SAMPLE</button>
            <button onClick={() => setInput(JSON.stringify(LARGE_SAMPLE_JSON, null, 2))} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">LARGE</button>
            <button onClick={handleFormat} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold transition-colors">FORMAT</button>
            <div className="w-px h-4 mx-1 bg-gray-300 dark:bg-gray-700" />
            <button onClick={handleClear} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Clear"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <Editor
              value={input}
              onValueChange={code => setInput(code)}
              highlight={code => highlight(code, languages.json, 'json')}
              padding={20}
              className="min-h-full focus:outline-none"
              textareaId="input-json-editor"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
                lineHeight: '1.5',
                backgroundColor: isDark ? '#111827' : '#f9fafb',
                color: isDark ? '#e5e7eb' : '#374151',
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
            <Editor
              value={outputMode === 'optimized' ? output : restored}
              onValueChange={() => {}}
              highlight={code => highlight(code, languages.json, 'json')}
              padding={20}
              readOnly
              className="min-h-full"
              textareaId="output-json-editor"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
                lineHeight: '1.5',
                backgroundColor: isDark ? '#111827' : '#f9fafb',
                color: isDark ? '#d1d5db' : '#4b5563',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
