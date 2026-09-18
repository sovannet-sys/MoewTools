import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { HomeView } from './components/HomeView';
import { JsonFormatterTool } from './components/JsonFormatterTool';
import { PasswordGeneratorTool } from './components/PasswordGeneratorTool';
import { UnlockPdfTool } from './components/UnlockPdfTool';
import { CompressPdfTool } from './components/CompressPdfTool';
import { ToastMessage, ToolId } from './types';

export default function App() {
  const [currentTool, setCurrentTool] = useState<ToolId>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.documentElement.classList.contains('dark')
      );
    }
    return false;
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleNavigate = (tool: ToolId) => {
    setCurrentTool(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, isError = false) => {
    const newToast: ToastMessage = {
      id: Date.now(),
      message,
      isError,
    };
    setToast(newToast);
    setTimeout(() => {
      setToast((current) => (current?.id === newToast.id ? null : current));
    }, 3500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <Header
        currentTool={currentTool}
        onNavigate={handleNavigate}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTool === 'home' && <HomeView onSelectTool={handleNavigate} />}

        {currentTool === 'unlockpdf' && (
          <UnlockPdfTool onBack={handleNavigate} onToast={showToast} />
        )}

        {currentTool === 'compresspdf' && (
          <CompressPdfTool onBack={handleNavigate} onToast={showToast} />
        )}

        {currentTool === 'json' && (
          <JsonFormatterTool onBack={handleNavigate} onToast={showToast} />
        )}

        {currentTool === 'password' && (
          <PasswordGeneratorTool onBack={handleNavigate} onToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} Moew PDF. All processing executes 100% securely inside your browser.
        </p>
      </footer>

      {/* Global Toast */}
      <Toast toast={toast} />
    </div>
  );
}
