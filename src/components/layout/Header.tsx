import { Zap, Github, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDocumentation } from '@/hooks/useDocumentation';

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { data: docData, status: docStatus } = useDocumentation();

  return (
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
            onClick={toggleTheme}
            className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
