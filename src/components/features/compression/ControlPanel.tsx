import { CheckCircle2 } from 'lucide-react';
import { restore } from 'llm-chat-msg-compressor';
import toast from 'react-hot-toast';
import { useCompression } from '@/providers/CompressionProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function ControlPanel() {
  const { options, setOptions, input, output } = useCompression();
  const { isDark } = useTheme();

  const handleVerify = () => {
    try {
      const parsedInput = JSON.parse(input);
      const parsedOutput = JSON.parse(output);
      const restored = restore(parsedOutput);
      
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

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 p-0.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-sm'}`}>
              <input 
                type="checkbox" 
                checked={options.aggressive}
                onChange={(e) => setOptions({ ...options, aggressive: e.target.checked })}
                className={`w-3 h-3 rounded transition-all ${isDark ? 'border-gray-400 bg-gray-700 text-blue-400 focus:ring-blue-400 focus:ring-offset-gray-800' : 'border-gray-500 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white'} focus:ring-2 focus:ring-offset-2`}
              />
              <span className={`text-[10px] font-semibold transition-colors ${isDark ? 'text-gray-200 group-hover:text-blue-300' : 'text-gray-700 group-hover:text-blue-700'}`}>Aggressive</span>
            </label>
            <label className={`flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-md transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-sm'}`}>
              <input 
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
  );
}
