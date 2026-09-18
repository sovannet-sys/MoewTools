import React, { useState } from 'react';
import { ArrowLeft, Braces, Copy, Check, Sparkles, Trash2 } from 'lucide-react';
import { ToolId } from '../types';

interface JsonFormatterToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const JsonFormatterTool: React.FC<JsonFormatterToolProps> = ({
  onBack,
  onToast,
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatWithIndent = (raw: string, spaceCount: number) => {
    if (!raw.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const formatted =
        spaceCount === 0
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, spaceCount);
      setOutput(formatted);
      setError(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(errMsg);
      setOutput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    formatWithIndent(val, indent);
  };

  const handleIndentChange = (spaces: number) => {
    setIndent(spaces);
    formatWithIndent(input, spaces);
  };

  const handleLoadSample = () => {
    const sample = {
      name: 'Moew PDF Suite',
      version: '3.2.0',
      active: true,
      features: [
        'Client-Side PDF Decryption',
        'Multi-Tier Size Compression',
        'Syntax Highlighting JSON Engine',
        'Cryptographic Key Generation',
      ],
      compressionTiers: {
        low: '30% - 50% Reduction (Maximum Vector Sharpness)',
        medium: '50% - 70% Reduction (Balanced Optimization)',
        high: '70% - 90% Reduction (Ultra-Compact Document)',
      },
      telemetry: {
        serverUploads: false,
        privacyGuaranteed: true,
      },
    };
    const str = JSON.stringify(sample, null, 2);
    setInput(str);
    formatWithIndent(str, indent);
    onToast('Sample JSON payload loaded');
  };

  const handleCopy = () => {
    const textToCopy = output || input;
    if (!textToCopy.trim()) {
      onToast('No output to copy!', true);
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onToast('Copied formatted JSON to clipboard!');
      },
      () => {
        onToast('Failed to copy to clipboard', true);
      }
    );
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    onToast('Editor cleared');
  };

  return (
    <div id="json-formatter-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            id="json-back-btn"
            onClick={() => onBack('home')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Back to All Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Braces className="w-5 h-5 text-amber-500" />
              <span>JSON Formatter & Validator</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Format, inspect, minify, and validate JSON payloads instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="json-sample-btn"
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample</span>
          </button>
          <button
            id="json-clear-btn"
            onClick={handleClear}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Clear inputs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            id="json-copy-btn"
            onClick={handleCopy}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Output'}</span>
          </button>
        </div>
      </div>

      {/* Editor layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input pane */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Input Raw JSON
            </label>
            <span
              id="json-status-badge"
              className={`text-xs font-bold ${
                error
                  ? 'text-rose-600 dark:text-rose-400'
                  : input.trim()
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {error ? 'Syntax Error ✗' : input.trim() ? 'Valid JSON ✓' : 'Ready'}
            </span>
          </div>
          <textarea
            id="json-input-area"
            value={input}
            onChange={handleInputChange}
            rows={16}
            placeholder="Paste your unformatted or minified JSON here..."
            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-y shadow-xs"
          />
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-mono">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
        </div>

        {/* Output pane */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Formatted Output
            </label>
            <div className="flex items-center space-x-1">
              <button
                id="indent-2-btn"
                onClick={() => handleIndentChange(2)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  indent === 2
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                2 Spaces
              </button>
              <button
                id="indent-4-btn"
                onClick={() => handleIndentChange(4)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  indent === 4
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                4 Spaces
              </button>
              <button
                id="indent-minify-btn"
                onClick={() => handleIndentChange(0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  indent === 0
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Minify
              </button>
            </div>
          </div>
          <pre
            id="json-output-area"
            className="w-full h-[376px] p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono overflow-auto text-slate-900 dark:text-slate-100 shadow-xs select-all"
          >
            {output || (
              <span className="text-slate-400 dark:text-slate-500 italic">
                Formatted JSON structure will render here automatically...
              </span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
