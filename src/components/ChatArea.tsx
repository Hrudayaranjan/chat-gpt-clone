import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Cpu,
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  FileText,
  Clock,
  Key,
  Download,
  Share2,
  Lightbulb,
  Code2,
  Brain,
  Rocket,
} from 'lucide-react';
import { Conversation, Message, ModelInfo, AVAILABLE_MODELS, Attachment, AppSettings } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ThinkingBox } from './ThinkingBox';
import { SpeechAssistant } from '../utils/speech';

interface ChatAreaProps {
  conversation: Conversation | null;
  currentModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenNvidiaModal: () => void;
  isNvidiaKeySet: boolean;
  settings: AppSettings;
  onExportMarkdown: (conv: Conversation) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentModel,
  onSelectModel,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onToggleSidebar,
  onOpenSettings,
  onOpenNvidiaModal,
  isNvidiaKeySet,
  settings,
  onExportMarkdown,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll during message generation
  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages, isStreaming, settings.autoScroll]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Handle Form Submit
  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;

    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File Upload Handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
        });
      } else {
        const text = await fileToText(file);
        newAttachments.push({
          id,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: text,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice Speech to Text
  const toggleListening = () => {
    if (isListening && speechRecognizer) {
      speechRecognizer.stop();
      setIsListening(false);
      return;
    }

    const rec = SpeechAssistant.startListening(
      (transcript) => {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (rec) {
      setSpeechRecognizer(rec);
      setIsListening(true);
    }
  };

  // Text to Speech
  const handleSpeak = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      SpeechAssistant.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    SpeechAssistant.stopSpeaking();
    setSpeakingMessageId(messageId);
    SpeechAssistant.speak(text, () => {
      setSpeakingMessageId(null);
    });
  };

  // Copy Message Text
  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  // Quick Starter Prompts
  const starterPrompts = [
    {
      icon: Code2,
      category: 'Coding & Architecture',
      title: 'Distributed Rate Limiter',
      prompt:
        'Write a complete, high-performance distributed rate limiter in TypeScript using Redis token bucket algorithm with exponential backoff.',
    },
    {
      icon: Brain,
      category: 'Deep Reasoning',
      title: 'Quantum Entanglement Simply',
      prompt:
        'Explain quantum entanglement and Bell inequalities to a computer science undergraduate using intuitive computing analogies.',
    },
    {
      icon: Cpu,
      category: 'NVIDIA Hardware & AI',
      title: 'NVIDIA NIM Architecture',
      prompt:
        'How does NVIDIA NIM optimize tensor parallel inference latency and KV cache memory management compared to standard vLLM?',
    },
    {
      icon: Rocket,
      category: 'Fullstack Engineering',
      title: 'WebSocket Live Sync',
      prompt:
        'Architect a real-time collaborative document synchronization system using CRDTs (Conflict-free Replicated Data Types) and WebSockets.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-900 text-zinc-100 relative overflow-hidden">
      {/* Top Navigation Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700/60 transition-all cursor-pointer group"
            >
              {currentModel.provider === 'nvidia' ? (
                <Cpu className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-400" />
              )}
              <span className="font-semibold text-sm text-zinc-100">{currentModel.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  currentModel.provider === 'nvidia'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                }`}
              >
                {currentModel.provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
            </button>

            {/* Model Dropdown Menu */}
            {isModelDropdownOpen && (
              <>
                <div
                  onClick={() => setIsModelDropdownOpen(false)}
                  className="fixed inset-0 z-30"
                />
                <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-40 space-y-2 max-h-[80vh] overflow-y-auto">
                  {/* Google Gemini Section */}
                  <div className="px-3 pt-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Google Gemini (Active)</span>
                    <span className="text-blue-400 font-normal lowercase">cloud environment</span>
                  </div>

                  {AVAILABLE_MODELS.filter((m) => m.provider === 'gemini').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-start space-x-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        currentModel.id === model.id
                          ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-zinc-100">{model.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {model.contextLength}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {model.description}
                        </p>
                      </div>
                    </button>
                  ))}

                  <div className="h-px bg-zinc-800 my-1" />

                  {/* NVIDIA NIM Section */}
                  <div className="px-3 pt-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>NVIDIA NIM Models</span>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsModelDropdownOpen(false);
                        onOpenNvidiaModal();
                      }}
                      className="text-emerald-400 hover:underline cursor-pointer font-normal normal-case text-[11px]"
                    >
                      {isNvidiaKeySet ? 'Key Configured ✓' : '+ Configure Key'}
                    </span>
                  </div>

                  {AVAILABLE_MODELS.filter((m) => m.provider === 'nvidia').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model);
                        setIsModelDropdownOpen(false);
                        if (!isNvidiaKeySet) {
                          onOpenNvidiaModal();
                        }
                      }}
                      className={`w-full flex items-start space-x-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        currentModel.id === model.id
                          ? 'bg-zinc-800 text-zinc-100 border border-emerald-500/40'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-zinc-100 flex items-center space-x-1.5">
                            <span>{model.name}</span>
                            {model.supportsThinking && (
                              <span className="text-[9px] px-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                                Reasoning
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {model.contextLength}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {model.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick NVIDIA Key status pill */}
          <button
            onClick={onOpenNvidiaModal}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isNvidiaKeySet
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Configure NVIDIA API Key"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isNvidiaKeySet ? 'NVIDIA Key Active' : 'Set NVIDIA Key'}</span>
          </button>

          {/* Export Chat */}
          {conversation && conversation.messages.length > 0 && (
            <button
              onClick={() => onExportMarkdown(conversation)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
              title="Export Conversation (Markdown)"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Share / Copy feedback */}
          {conversation && conversation.messages.length > 0 && (
            <button
              onClick={() => {
                const text = conversation.messages
                  .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                  .join('\n\n');
                navigator.clipboard.writeText(text);
                setCopiedShare(true);
                setTimeout(() => setCopiedShare(false), 2000);
              }}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
              title="Copy Entire Chat"
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Screen if empty */}
          {(!conversation || conversation.messages.length === 0) && (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 py-8 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-zinc-800 to-emerald-500/30 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
                  {currentModel.provider === 'nvidia' ? (
                    <Cpu className="w-9 h-9 text-emerald-400" />
                  ) : (
                    <Sparkles className="w-9 h-9 text-emerald-400" />
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                  What can I help with today?
                </h1>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Powered by <span className="text-zinc-200 font-semibold">{currentModel.name}</span>.
                  Switch freely between Gemini 2.5 and NVIDIA NIM models.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {starterPrompts.map((starter, idx) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(starter.prompt, [])}
                      className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-left group cursor-pointer shadow-sm hover:scale-[1.01]"
                    >
                      <div className="flex items-center space-x-2 text-zinc-400 group-hover:text-emerald-400 transition-colors mb-1.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {starter.category}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-zinc-200 group-hover:text-white">
                        {starter.title}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {starter.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Rendering */}
          {conversation?.messages.map((message) => {
            const isUser = message.role === 'user';
            const isSpeakingThis = speakingMessageId === message.id;
            const isCopiedThis = copiedMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 ${
                  isUser ? 'justify-end' : 'justify-start'
                } group`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0 text-emerald-400 mt-1 shadow-sm">
                    {message.provider === 'nvidia' ? (
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 transition-all ${
                    isUser
                      ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm border border-zinc-700/60'
                      : 'bg-zinc-950/80 text-zinc-200 rounded-tl-sm border border-zinc-800/80 shadow-md'
                  }`}
                >
                  {/* Assistant Header Badge */}
                  {!isUser && (
                    <div className="flex items-center justify-between mb-2 text-xs text-zinc-400 border-b border-zinc-800/60 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-zinc-200">
                          {message.model || currentModel.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            message.provider === 'nvidia'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          }`}
                        >
                          {message.provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}
                        </span>
                      </div>
                      {message.latencyMs && (
                        <span className="flex items-center space-x-1 text-[11px] text-zinc-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{(message.latencyMs / 1000).toFixed(1)}s</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Thinking Process if present */}
                  {message.reasoningContent && (
                    <ThinkingBox
                      content={message.reasoningContent}
                      isStreaming={message.isStreaming}
                    />
                  )}

                  {/* Attached Images or Files (User Message) */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center space-x-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700/60 text-xs text-zinc-300"
                        >
                          {att.base64 ? (
                            <img
                              src={att.base64}
                              alt={att.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="max-w-[120px] truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <MarkdownRenderer
                    content={message.content}
                    isStreaming={message.isStreaming}
                  />

                  {/* Error Notification */}
                  {message.error && (
                    <div className="mt-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                      {message.error}
                    </div>
                  )}

                  {/* Action Bar (Assistant Message) */}
                  {!isUser && !message.isStreaming && message.content && (
                    <div className="flex items-center space-x-1 pt-2.5 mt-2 border-t border-zinc-800/40 text-zinc-500">
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
                        title="Copy Response"
                      >
                        {isCopiedThis ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeak(message.id, message.content)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSpeakingThis
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : 'hover:text-zinc-200 hover:bg-zinc-800/60'
                        }`}
                        title={isSpeakingThis ? 'Stop Reading' : 'Read Aloud'}
                      >
                        {isSpeakingThis ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0 text-zinc-200 mt-1 shadow-sm font-semibold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Stop Streaming Button Floating */}
      {isStreaming && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={onStopStreaming}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 shadow-xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
          >
            <Square className="w-3.5 h-3.5 fill-current text-red-400" />
            <span>Stop generating</span>
          </button>
        </div>
      )}

      {/* Input Bar Footer */}
      <footer className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800/80">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center space-x-2 px-2.5 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-200 border border-zinc-700"
                >
                  {att.base64 ? (
                    <img
                      src={att.base64}
                      alt={att.name}
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="max-w-[140px] truncate">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 hover:text-red-400 text-zinc-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea & Controls */}
          <div className="relative flex items-end rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/80 shadow-lg p-2 transition-all">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.js,.ts,.py,.md,.json,.csv,.html,.css"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Attach images or files"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentModel.name}... (Shift+Enter for new line)`}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none max-h-48 font-sans leading-relaxed"
            />

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shrink-0 ml-1"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors cursor-pointer shrink-0 ml-1 shadow-md shadow-emerald-950"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer Disclaimer */}
          <p className="text-[11px] text-center text-zinc-500">
            OmniChat can make mistakes. Verify important info. Dual-engine architecture with{' '}
            <span className="text-zinc-400">Gemini 2.5</span> &{' '}
            <span className="text-emerald-400 font-medium">NVIDIA NIM</span> API.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper: Convert File to Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Helper: Convert File to Text
function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
