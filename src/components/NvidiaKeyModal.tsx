import React, { useState } from 'react';
import { Key, ExternalLink, CheckCircle2, AlertCircle, Loader2, X, Eye, EyeOff, Cpu, ShieldCheck } from 'lucide-react';

interface NvidiaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  onFallbackToGemini: () => void;
}

export const NvidiaKeyModal: React.FC<NvidiaKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  onFallbackToGemini,
}) => {
  const [apiKey, setApiKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid NVIDIA API Key.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/verify-nvidia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nvidia-api-key': apiKey.trim(),
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: 'Verified! Successfully connected to NVIDIA NIM infrastructure.',
        });
        onSaveKey(apiKey.trim());
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to authenticate with NVIDIA API. Check key.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection error';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveWithoutTesting = () => {
    onSaveKey(apiKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Decorative Green Accent for NVIDIA */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <span>NVIDIA NIM API Configuration</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                API Key
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Run models like Llama 3.3 70B, DeepSeek R1, and Nemotron via NVIDIA NIM.
            </p>
          </div>
        </div>

        {/* Step Guide */}
        <div className="mb-4 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center justify-between font-medium text-emerald-400">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>How to get an NVIDIA API Key:</span>
            </span>
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-emerald-400 hover:underline"
            >
              <span>build.nvidia.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside text-zinc-400 space-y-1">
            <li>Visit <strong>build.nvidia.com</strong> and sign up (1,000 free credits included).</li>
            <li>Select any model (e.g. <em>meta/llama-3.3-70b-instruct</em>) and click <strong>Get API Key</strong>.</li>
            <li>Paste your key (<code className="text-emerald-400">nvapi-...</code>) below or add it to <code className="text-zinc-300">.env</code>.</li>
          </ol>
        </div>

        {/* Input Field */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>NVIDIA API Key</span>
            {currentKey && (
              <span className="text-[11px] text-emerald-400 font-normal">Active key saved</span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatusMessage(null);
              }}
              className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Verification Status feedback */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-start space-x-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleVerifyAndSave}
            disabled={isVerifying || !apiKey.trim()}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying with NVIDIA...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Save Key</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveWithoutTesting}
            disabled={!apiKey.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Save Directly
          </button>
        </div>

        {/* Fallback Option */}
        <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
          <button
            onClick={() => {
              onFallbackToGemini();
              onClose();
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            Don't have a key right now? <span className="underline font-medium text-emerald-400">Switch to Gemini 2.5 Flash (Free & Active)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
