import React from 'react';
import { Cat, Home, Languages, Moon, Sun } from 'lucide-react';
import { ToolId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentTool: ToolId;
  onNavigate: (tool: ToolId) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTool,
  onNavigate,
  isDarkMode,
  onToggleTheme,
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div
          id="brand-logo-button"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onNavigate('home');
            }
          }}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Cat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
              Moew Tools
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t.header.brandSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentTool !== 'home' && (
            <button
              id="nav-all-tools-button"
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.header.allTools}</span>
            </button>
          )}

          {/* Language Toggle Button (English <-> Khmer) */}
          <button
            id="language-toggle-button"
            type="button"
            onClick={toggleLanguage}
            className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 flex items-center space-x-1.5 transition-all cursor-pointer group"
            title={t.header.toggleLanguagePrompt}
            aria-label="Toggle language between English and Khmer"
          >
            <Languages className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform duration-200" />
            <span className="text-xs font-extrabold tracking-tight">
              {language === 'en' ? 'EN' : 'ខ្មែរ'}
            </span>
            <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-500/80 transition-colors">
              {language === 'en' ? 'ខ្មែរ' : 'EN'}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer"
            title={isDarkMode ? t.header.switchThemeLight : t.header.switchThemeDark}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
