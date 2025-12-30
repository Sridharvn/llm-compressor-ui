import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { CompressionProvider } from '@/providers/CompressionProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsGrid } from '@/components/features/compression/StatsGrid';
import { CompressionAnalysis } from '@/components/features/compression/CompressionAnalysis';
import { ControlPanel } from '@/components/features/compression/ControlPanel';
import { EditorPane } from '@/components/features/compression/EditorPane';
import { Documentation } from '@/components/features/docs/Documentation';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster position="bottom-right" />
      
      <Header />

      <div className={`shrink-0 border-b ${isDark ? 'border-gray-800 bg-gradient-to-r from-gray-900/40 via-gray-900/30 to-gray-900/40' : 'border-gray-100 bg-gradient-to-r from-gray-50/80 via-white/60 to-gray-50/80'}`}>
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <StatsGrid />
          <CompressionAnalysis />
        </div>
        <ControlPanel />
      </div>

      <main className="flex-1 flex flex-col min-h-[60vh] p-2 md:p-4">
        <EditorPane />
      </main>

      <Documentation />
      
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CompressionProvider>
        <AppContent />
      </CompressionProvider>
    </ThemeProvider>
  );
}
