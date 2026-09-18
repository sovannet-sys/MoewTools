import React from 'react';
import { Cat, Home, Moon, Sun } from 'lucide-react';
import { ToolId } from '../types';

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
              Moew PDF
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              All-in-One Utility Suite
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentTool !== 'home' && (
            <button
              id="nav-all-tools-button"
              onClick={() => onNavigate('home')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>All Tools</span>
            </button>
          )}
          <button
            id="theme-toggle-button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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
