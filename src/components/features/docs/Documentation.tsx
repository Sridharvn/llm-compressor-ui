import { useState } from 'react';
import { Zap, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDocumentation } from '@/hooks/useDocumentation';
import { useTheme } from '@/providers/ThemeProvider';

export function Documentation() {
  const { data: docData } = useDocumentation();
  const { isDark } = useTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySection = async (id: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
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

  return (
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
  );
}
