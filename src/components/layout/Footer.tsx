import { useTheme } from '@/providers/ThemeProvider';

export function Footer() {
  const { isDark } = useTheme();

  return (
    <footer className={`shrink-0 py-2 px-4 border-t ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
      <div className="max-w-[1600px] mx-auto flex items-center justify-between text-[10px]">
        <p>© 2025 LLM Compressor</p>
        <div className="flex items-center gap-4">
          <a href="https://github.com/Sridharvn/llm-chat-msg-compressor" target="_blank" rel="noopener" className="hover:text-blue-500">Documentation</a>
        </div>
      </div>
    </footer>
  );
}
