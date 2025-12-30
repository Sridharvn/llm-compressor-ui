import { FileJson, Zap, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useCompression } from '@/providers/CompressionProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function StatsGrid() {
  const { stats } = useCompression();
  const { isDark } = useTheme();
  const tokenSavingsNum = parseFloat(stats.tokenSavings);

  return (
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
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stats.inputTokens} tokens</div>
        </div>
      </div>

      {/* Optimized Size Card */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Optimized</span>
          <div className={`p-2 rounded-lg ${tokenSavingsNum > 0 ? 'bg-green-500/20' : tokenSavingsNum < 0 ? 'bg-red-500/20' : 'bg-gray-100'}`}>
            <Zap className={`w-4 h-4 ${tokenSavingsNum > 0 ? 'text-green-500' : tokenSavingsNum < 0 ? 'text-red-500' : 'text-gray-500'}`} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={`font-mono text-2xl font-bold ${tokenSavingsNum > 0 ? 'text-green-600 dark:text-green-400' : tokenSavingsNum < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{stats.outputSize} B</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stats.outputTokens} tokens</div>
        </div>
      </div>

      {/* Savings Card */}
      <div className={`p-6 rounded-xl border ${tokenSavingsNum > 0 ? 
        (isDark ? 'bg-green-900/20 border-green-700/50 backdrop-blur-sm' : 'bg-green-50/80 border-green-200/50 backdrop-blur-sm shadow-sm') :
        tokenSavingsNum < 0 ?
        (isDark ? 'bg-red-900/20 border-red-700/50 backdrop-blur-sm animate-pulse-error' : 'bg-red-50/80 border-red-200/50 backdrop-blur-sm shadow-sm animate-pulse-error') :
        (isDark ? 'bg-gray-800/40 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm shadow-sm')
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
            tokenSavingsNum > 0 ? 'text-green-700 dark:text-green-300' :
            tokenSavingsNum < 0 ? 'text-red-700 dark:text-red-300' :
            (isDark ? 'text-gray-300' : 'text-gray-700')
          }`}>
            {tokenSavingsNum > 0 ? 'Savings' : tokenSavingsNum < 0 ? 'Increase' : 'No Change'}
            <Info className="w-3 h-3" />
          </span>
          <div className={`p-2 rounded-lg ${
            tokenSavingsNum > 0 ? 'bg-green-500/20' :
            tokenSavingsNum < 0 ? 'bg-red-500/20' : 'bg-gray-100'
          }`}>
            {tokenSavingsNum > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : tokenSavingsNum < 0 ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <Info className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className={`font-mono text-2xl font-bold animate-slide-in-up ${
            tokenSavingsNum > 0 ? 'text-green-600 dark:text-green-400' :
            tokenSavingsNum < 0 ? 'text-red-600 dark:text-red-400' : ''
          }`}>
            {tokenSavingsNum > 0 ? '+' : ''}{stats.tokenSavings}%
          </div>
          <div className={`text-sm ${
            tokenSavingsNum > 0 ? 'text-green-600 dark:text-green-400' :
            tokenSavingsNum < 0 ? 'text-red-600 dark:text-red-400' :
            (isDark ? 'text-gray-400' : 'text-gray-600')
          }`}>
            {tokenSavingsNum > 0 ? 'Tokens saved' :
             tokenSavingsNum < 0 ? 'Token overhead' : 'No change'}
          </div>
        </div>
      </div>
    </div>
  );
}
