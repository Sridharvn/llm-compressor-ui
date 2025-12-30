import { useCompression } from '@/providers/CompressionProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function CompressionAnalysis() {
  const { stats } = useCompression();
  const { isDark } = useTheme();
  const tokenSavingsNum = parseFloat(stats.tokenSavings);

  return (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800/20 border-gray-700/30' : 'bg-gray-50/50 border-gray-200/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Compression Analysis</span>
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
              stroke={tokenSavingsNum > 0 ? '#10b981' : tokenSavingsNum < 0 ? '#ef4444' : '#6b7280'}
              strokeWidth="6"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.abs(tokenSavingsNum) / 100)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${
              tokenSavingsNum > 0 ? 'text-green-600 dark:text-green-400' :
              tokenSavingsNum < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600'
            }`}>
              {Math.abs(tokenSavingsNum)}%
            </span>
          </div>
        </div>
        
        {/* Linear Progress */}
        <div className="flex-1">
          <div className="relative">
            <div className={`h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-full transition-all duration-700 ease-out progress-bar-glow ${
                  tokenSavingsNum > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  tokenSavingsNum < 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
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
                tokenSavingsNum > 0 ? 'text-green-600 dark:text-green-400' :
                tokenSavingsNum < 0 ? 'text-red-600 dark:text-red-400' :
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
      {tokenSavingsNum !== 0 && (
        <div className={`mt-4 p-3 rounded-lg border-l-4 ${
          tokenSavingsNum > 0 ? 
          (isDark ? 'bg-green-900/20 border-green-500 text-green-200' : 'bg-green-50 border-green-500 text-green-800') :
          (isDark ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-red-50 border-red-500 text-red-800')
        }`}>
          <p className="text-sm font-medium">
            {tokenSavingsNum > 0 ? (
              `✅ Successfully compressed! You'll save ${Math.abs(tokenSavingsNum)}% on LLM API costs.`
            ) : (
              `⚠️ Compression increased size by ${Math.abs(tokenSavingsNum)}%. Original data may already be optimized.`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
