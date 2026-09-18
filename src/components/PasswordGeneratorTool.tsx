import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ToolId } from '../types';

interface PasswordGeneratorToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const PasswordGeneratorTool: React.FC<PasswordGeneratorToolProps> = ({
  onBack,
  onToast,
}) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState<number>(18);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = '';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setPassword('');
      return;
    }

    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    setPassword(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Calculate password entropy
  const getEntropy = () => {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 28;
    if (poolSize === 0) return 0;
    return Math.round(length * Math.log2(poolSize));
  };

  const entropy = getEntropy();

  const getStrengthMeta = () => {
    if (entropy < 40) {
      return { label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', pct: '25%' };
    }
    if (entropy < 60) {
      return { label: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', pct: '50%' };
    }
    if (entropy < 80) {
      return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', pct: '75%' };
    }
    return { label: 'Unbreakable (Military Grade)', color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400', pct: '100%' };
  };

  const strength = getStrengthMeta();

  const handleCopy = () => {
    if (!password) {
      onToast('No password generated!', true);
      return;
    }
    navigator.clipboard.writeText(password).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onToast('Copied password to clipboard!');
      },
      () => {
        onToast('Failed to copy to clipboard', true);
      }
    );
  };

  return (
    <div id="password-generator-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            id="password-back-btn"
            onClick={() => onBack('home')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Back to All Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-emerald-500" />
              <span>Secure Password Generator</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Generate cryptographic passwords with customizable symbols, numbers, and length.
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        {/* Output Display */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              id="password-display-input"
              type="text"
              readOnly
              value={password || 'Please select at least one character type'}
              className="w-full p-4 pr-24 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono font-bold tracking-wider text-emerald-700 dark:text-emerald-400 focus:outline-none select-all shadow-inner"
            />
            <button
              id="password-copy-btn"
              onClick={handleCopy}
              className="absolute right-2.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Entropy & Strength Meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                {entropy >= 60 ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Strength:</span>
                <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {entropy} bits of entropy
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.pct }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5 pt-2">
          {/* Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Password Length</span>
              <span id="password-length-val" className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-extrabold">
                {length} characters
              </span>
            </div>
            <input
              id="password-length-slider"
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>8 chars</span>
              <span>24 chars</span>
              <span>48 chars</span>
              <span>64 chars</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-2 gap-3">
            <label
              id="opt-upper-label"
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition cursor-pointer ${
                useUpper
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => setUseUpper(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold">Uppercase (A-Z)</span>
            </label>

            <label
              id="opt-lower-label"
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition cursor-pointer ${
                useLower
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => setUseLower(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold">Lowercase (a-z)</span>
            </label>

            <label
              id="opt-numbers-label"
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition cursor-pointer ${
                useNumbers
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => setUseNumbers(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold">Numbers (0-9)</span>
            </label>

            <label
              id="opt-symbols-label"
              className={`flex items-center space-x-3 p-3 rounded-2xl border transition cursor-pointer ${
                useSymbols
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => setUseSymbols(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold">Symbols (!@#$)</span>
            </label>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400">Presets:</span>
            <button
              onClick={() => {
                setLength(12);
                setUseUpper(true);
                setUseLower(true);
                setUseNumbers(true);
                setUseSymbols(false);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Alphanumeric (12)
            </button>
            <button
              onClick={() => {
                setLength(20);
                setUseUpper(true);
                setUseLower(true);
                setUseNumbers(true);
                setUseSymbols(true);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              High Entropy (20)
            </button>
            <button
              onClick={() => {
                setLength(32);
                setUseUpper(true);
                setUseLower(true);
                setUseNumbers(true);
                setUseSymbols(true);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Maximum (32)
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          id="generate-password-btn"
          onClick={generatePassword}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Generate New Password</span>
        </button>
      </div>
    </div>
  );
};
