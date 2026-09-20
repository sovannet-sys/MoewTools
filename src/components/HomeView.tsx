import React, { useState, useMemo } from 'react';
import {
  Braces,
  FileArchive,
  FileImage,
  Files,
  Image as ImageIcon,
  KeyRound,
  Search,
  Unlock,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { ToolCategory, ToolDefinition, ToolId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HomeViewProps {
  onSelectTool: (id: ToolId) => void;
}

const TOOL_BASE_CONFIG: Array<{
  id: ToolId;
  category: 'dev' | 'security' | 'pdf';
  tags: string[];
}> = [
  {
    id: 'pdftopng',
    category: 'pdf',
    tags: ['pdf', 'photo', 'photos', 'png', 'image', 'convert', 'extract', 'render', 'high res', 'dpi', 'zip'],
  },
  {
    id: 'imgtopdf',
    category: 'pdf',
    tags: ['picture', 'image', 'photo', 'pdf', 'convert', 'jpg', 'png', 'webp', 'album', 'images to pdf'],
  },
  {
    id: 'unlockpdf',
    category: 'pdf',
    tags: ['unlock', 'pdf', 'password', 'decrypt', 'remove', 'unknown', 'bypass', 'security'],
  },
  {
    id: 'mergepdf',
    category: 'pdf',
    tags: ['merge', 'pdf', 'combine', 'join', 'reorder', 'pages', 'documents', 'unite'],
  },
  {
    id: 'compresspdf',
    category: 'pdf',
    tags: ['compress', 'pdf', 'file size', 'reduce', 'optimize', 'shrink', 'mb', 'kb', 'massive'],
  },
  {
    id: 'json',
    category: 'dev',
    tags: ['json', 'formatter', 'validator', 'minify', 'pretty print', 'developer', 'parse'],
  },
  {
    id: 'password',
    category: 'security',
    tags: ['password', 'generator', 'security', 'random', 'crypto', 'entropy', 'pin'],
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTool }) => {
  const { t, language } = useLanguage();
  const isKhmer = language === 'km';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');

  const tools: ToolDefinition[] = useMemo(() => {
    return TOOL_BASE_CONFIG.map((item) => {
      const toolTranslation = t.tools[item.id] || {
        name: item.id,
        shortDesc: '',
        categoryLabel: item.category.toUpperCase(),
      };
      return {
        id: item.id,
        name: toolTranslation.name,
        shortDesc: toolTranslation.shortDesc,
        category: item.category,
        categoryLabel: toolTranslation.categoryLabel,
        tags: item.tags,
      };
    });
  }, [t]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;
      const inName = tool.name.toLowerCase().includes(q);
      const inDesc = tool.shortDesc.toLowerCase().includes(q);
      const inTags = tool.tags.some((tag) => tag.toLowerCase().includes(q));
      return inName || inDesc || inTags;
    });
  }, [searchQuery, selectedCategory, tools]);

  const getToolIcon = (id: ToolId) => {
    switch (id) {
      case 'pdftopng':
        return <FileImage className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'imgtopdf':
        return <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'unlockpdf':
        return <Unlock className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'mergepdf':
        return <Files className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'compresspdf':
        return <FileArchive className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'json':
        return <Braces className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'password':
        return <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return null;
    }
  };

  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'pdf':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50';
      case 'dev':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50';
      case 'security':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getIconBgClass = (id: ToolId) => {
    switch (id) {
      case 'pdftopng':
        return 'bg-teal-500/10 dark:bg-teal-500/15 group-hover:bg-teal-500/20';
      case 'imgtopdf':
        return 'bg-cyan-500/10 dark:bg-cyan-500/15 group-hover:bg-cyan-500/20';
      case 'unlockpdf':
        return 'bg-rose-500/10 dark:bg-rose-500/15 group-hover:bg-rose-500/20';
      case 'mergepdf':
        return 'bg-blue-500/10 dark:bg-blue-500/15 group-hover:bg-blue-500/20';
      case 'compresspdf':
        return 'bg-orange-500/10 dark:bg-orange-500/15 group-hover:bg-orange-500/20';
      case 'json':
        return 'bg-amber-500/10 dark:bg-amber-500/15 group-hover:bg-amber-500/20';
      case 'password':
        return 'bg-emerald-500/10 dark:bg-emerald-500/15 group-hover:bg-emerald-500/20';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div id="home-view-container" className="space-y-8 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>{t.home.privacyBadge}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t.home.heroTitle}
        </h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t.home.heroSubtitle}
        </p>

        {/* Search */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 absolute left-4 top-5.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            id="tool-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1 pt-1">
          <button
            id="cat-all-btn"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {t.home.categoryAll}
          </button>
          <button
            id="cat-pdf-btn"
            onClick={() => setSelectedCategory('pdf')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'pdf'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {t.home.categoryPdf}
          </button>
          <button
            id="cat-dev-btn"
            onClick={() => setSelectedCategory('dev')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'dev'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {t.home.categoryDev}
          </button>
          <button
            id="cat-security-btn"
            onClick={() => setSelectedCategory('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {t.home.categorySecurity}
          </button>
        </div>
      </div>

      {/* Tool Grid */}
      <div
        id="tools-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-4xl mx-auto"
      >
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            id={`card-${tool.id}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTool(tool.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectTool(tool.id);
              }
            }}
            className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-lg hover:border-indigo-500/70 dark:hover:border-indigo-500/70 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 text-left"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${getIconBgClass(
                  tool.id
                )}`}
              >
                {getToolIcon(tool.id)}
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getBadgeClass(
                  tool.category
                )}`}
              >
                {tool.categoryLabel}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                <span>{tool.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600 dark:text-indigo-400" />
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
                {tool.shortDesc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>{isKhmer ? 'គ្មានការបង្ហោះទៅ Server' : 'Zero Server Uploads'}</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                {isKhmer ? 'បើកឧបករណ៍' : 'Open Tool'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.home.noToolsTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.home.noToolsDesc}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            {t.home.clearFilter}
          </button>
        </div>
      )}
    </div>
  );
};

