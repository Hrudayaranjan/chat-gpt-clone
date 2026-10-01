import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Cpu,
  Shield,
  Trash2,
  Download,
  Key,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppSettings, AVAILABLE_MODELS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportAll: () => void;
  onClearAll: () => void;
  onOpenNvidiaModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportAll,
  onClearAll,
  onOpenNvidiaModal,
}) => {
  const [activeTab, setActiveTab] = useState<'provider' | 'parameters' | 'instructions' | 'data'>('provider');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const systemPresets = [
    {
      title: 'Senior Software Architect',
      prompt:
        'You are an expert Principal Software Engineer. Always provide clean, robust, production-grade code with TypeScript/Python best practices, minimal comments, and solid architectural patterns.',
    },
    {
      title: 'Concise & Direct',
      prompt:
        'Be extremely concise, direct, and to the point. Answer questions directly without filler conversational phrases, greetings, or apologies.',
    },
    {
      title: 'Deep Researcher & Tutor',
      prompt:
        'You are an empathetic, insightful tutor and researcher. Explain complex technical and scientific concepts from first principles with intuitive real-world analogies.',
    },
    {
      title: 'General Assistant (Default)',
      prompt:
        'You are OmniChat, a helpful, intelligent, truthful, and versatile AI assistant built with ChatGPT capabilities. Provide well-structured, clear, insightful, and markdown-formatted answers.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Settings & Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-6 gap-2 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('provider')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'provider'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Providers & Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('parameters')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'parameters'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Model Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Custom Instructions</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'data'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Data & Controls</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: AI Providers & Keys */}
          {activeTab === 'provider' && (
            <div className="space-y-6">
              {/* Google Gemini Card */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">Google Gemini</h4>
                      <p className="text-xs text-zinc-400">Gemini 2.5 Flash & 2.5 Pro (1M - 2M tokens)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                    Ready & Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Runs directly through the server-side GenAI SDK using your Google AI Studio cloud environment.
                </p>
              </div>

              {/* NVIDIA NIM Card */}
              <div className="p-4 rounded-xl border border-emerald-900/40 bg-zinc-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 flex items-center space-x-2">
                        <span>NVIDIA NIM Models</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                          API Key
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400">Llama 3.3 70B, DeepSeek R1, Nemotron, Mistral Large</p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenNvidiaModal}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{localSettings.nvidiaApiKey ? 'Update Key' : 'Configure Key'}</span>
                  </button>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <p>
                    Status:{' '}
                    {localSettings.nvidiaApiKey ? (
                      <span className="text-emerald-400 font-medium">
                        Active key stored ({localSettings.nvidiaApiKey.slice(0, 10)}...)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">
                        No custom key stored. You can configure it above or set NVIDIA_API_KEY in .env.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Default Model Selector */}
              <div className="space-y-2">
                <label className="font-medium text-zinc-300">Default Model for New Chats</label>
                <select
                  value={localSettings.model}
                  onChange={(e) => {
                    const selModel = AVAILABLE_MODELS.find((m) => m.id === e.target.value);
                    setLocalSettings({
                      ...localSettings,
                      model: e.target.value,
                      provider: selModel?.provider || 'gemini',
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Google Gemini">
                    {AVAILABLE_MODELS.filter((m) => m.provider === 'gemini').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="NVIDIA NIM (Requires NVIDIA API Key)">
                    {AVAILABLE_MODELS.filter((m) => m.provider === 'nvidia').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Parameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-zinc-300 flex items-center space-x-1.5">
                    <span>Temperature</span>
                    <span className="text-xs text-zinc-500">
                      ({localSettings.temperature <= 0.3 ? 'Deterministic & Precise' : localSettings.temperature <= 0.8 ? 'Balanced' : 'Creative & Expressive'})
                    </span>
                  </label>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                    {localSettings.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>0.0 (Strict Code/Math)</span>
                  <span>0.7 (Default)</span>
                  <span>1.5 (High Variety)</span>
                </div>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-zinc-300">Top-P (Nucleus Sampling)</label>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                    {localSettings.topP.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={localSettings.topP}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Max Output Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-zinc-300">Max Output Length</label>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                    {localSettings.maxTokens} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={localSettings.maxTokens}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* UI Options */}
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-zinc-300">Auto-scroll during response streaming</span>
                  <input
                    type="checkbox"
                    checked={localSettings.autoScroll}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autoScroll: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-zinc-300 flex items-center space-x-2">
                    {localSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                    <span>Sound effects on message send</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Custom Instructions */}
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div>
                <label className="font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
                  <span>System Instructions</span>
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                </label>
                <p className="text-xs text-zinc-400 mb-2">
                  What would you like the AI to know about your preferences to provide better responses?
                </p>
                <textarea
                  rows={5}
                  value={localSettings.systemPrompt}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, systemPrompt: e.target.value })
                  }
                  placeholder="Enter system prompt instructions..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                />
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-400">Quick Presets:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {systemPresets.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, systemPrompt: preset.prompt })
                      }
                      className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/60 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-zinc-200">{preset.title}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                        {preset.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Data & Controls */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
                <h4 className="font-semibold text-zinc-200">Export Conversation History</h4>
                <p className="text-xs text-zinc-400">
                  Download all your chats, messages, and settings into a single JSON file.
                </p>
                <button
                  onClick={onExportAll}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export All Chats (JSON)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 space-y-3">
                <h4 className="font-semibold text-red-300">Clear All Chat History</h4>
                <p className="text-xs text-zinc-400">
                  Permanently erase all chat conversations and start fresh. This cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
                      onClearAll();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-900/70 border border-red-800/50 text-red-200 text-xs font-medium transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete All Conversations</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-950"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
