import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Conversation,
  Message,
  ModelInfo,
  AVAILABLE_MODELS,
  Attachment,
  AppSettings,
} from './types';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSettings,
  saveSettings,
  exportConversationsAsJSON,
  exportConversationAsMarkdown,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { NvidiaKeyModal } from './components/NvidiaKeyModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveConversationId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNvidiaModalOpen, setIsNvidiaModalOpen] = useState(false);
  const [serverConfig, setServerConfig] = useState<{ hasGeminiKey: boolean; hasNvidiaEnvKey: boolean } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch server configuration on mount
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => setServerConfig(data))
      .catch((err) => console.error('Failed to load server config:', err));
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Save active conversation ID to localStorage
  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  // Save settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Keyboard shortcut: Cmd+K / Ctrl+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine active conversation
  const activeConversation = useMemo(() => {
    if (!activeId) return null;
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  // Current selected model
  const currentModel: ModelInfo = useMemo(() => {
    // If active conversation has a specified model, use it; otherwise use settings.model
    const targetModelId = activeConversation?.model || settings.model;
    const found = AVAILABLE_MODELS.find((m) => m.id === targetModelId);
    return found || AVAILABLE_MODELS[0];
  }, [activeConversation, settings.model]);

  // Check if NVIDIA key is available either from settings or server env
  const isNvidiaKeySet = useMemo(() => {
    return !!(settings.nvidiaApiKey?.trim() || serverConfig?.hasNvidiaEnvKey);
  }, [settings.nvidiaApiKey, serverConfig]);

  // Handler: Start New Chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveId(null);
  };

  // Handler: Select Conversation
  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveId(id);
  };

  // Handler: Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  // Handler: Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Handler: Toggle Pin Conversation
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Handler: Select Model
  const handleSelectModel = (model: ModelInfo) => {
    setSettings((prev) => ({
      ...prev,
      model: model.id,
      provider: model.provider,
    }));

    if (activeId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, model: model.id, provider: model.provider } : c
        )
      );
    }
  };

  // Handler: Send Message
  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (isStreaming) return;

    // Check if user selected NVIDIA NIM model without key
    if (currentModel.provider === 'nvidia' && !isNvidiaKeySet) {
      setIsNvidiaModalOpen(true);
      return;
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    let targetConvId = activeId;
    let updatedConversations = [...conversations];

    // Play subtle audio cue if enabled
    if (settings.soundEnabled && typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(740, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch {}
    }

    // If no active conversation, create a new one
    if (!targetConvId) {
      targetConvId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const title = content.slice(0, 36) + (content.length > 36 ? '...' : '') || 'New Conversation';

      const newConv: Conversation = {
        id: targetConvId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
        model: currentModel.id,
        provider: currentModel.provider,
        systemPrompt: settings.systemPrompt,
      };

      updatedConversations.unshift(newConv);
      setActiveId(targetConvId);
    } else {
      updatedConversations = updatedConversations.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      });
    }

    // Prepare assistant message
    const assistantMessageId = `msg_ast_${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      reasoningContent: '',
      timestamp: Date.now(),
      model: currentModel.name,
      provider: currentModel.provider,
      isStreaming: true,
    };

    updatedConversations = updatedConversations.map((c) => {
      if (c.id === targetConvId) {
        return {
          ...c,
          messages: [...c.messages, assistantPlaceholder],
        };
      }
      return c;
    });

    setConversations(updatedConversations);
    setIsStreaming(true);

    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Get all previous messages for context
    const currentConv = updatedConversations.find((c) => c.id === targetConvId);
    const messagesHistory = (currentConv?.messages || [])
      .filter((m) => m.id !== assistantMessageId)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (currentModel.provider === 'nvidia' && settings.nvidiaApiKey?.trim()) {
        headers['x-nvidia-api-key'] = settings.nvidiaApiKey.trim();
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          messages: messagesHistory,
          model: currentModel.id,
          provider: currentModel.provider,
          temperature: settings.temperature,
          topP: settings.topP,
          maxTokens: settings.maxTokens,
          systemInstruction: settings.systemPrompt,
          attachments,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let accumulatedReasoning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '').trim();

          if (payload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? {
                                ...m,
                                error: parsed.error,
                                isStreaming: false,
                              }
                            : m
                        ),
                      }
                    : c
                )
              );
              break;
            }

            if (parsed.chunk) {
              accumulatedContent += parsed.chunk;
            }

            if (parsed.reasoningChunk) {
              accumulatedReasoning += parsed.reasoningChunk;
            }

            // Real-time message update
            setConversations((prev) =>
              prev.map((c) =>
                c.id === targetConvId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              reasoningContent: accumulatedReasoning,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : c
              )
            );
          } catch {
            // Partial JSON chunk, will be handled on next flush
          }
        }
      }

      const latencyMs = Date.now() - startTime;

      // Finalize assistant message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        reasoningContent: accumulatedReasoning,
                        isStreaming: false,
                        latencyMs,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User stopped generation manually
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId ? { ...m, isStreaming: false } : m
                  ),
                }
              : c
          )
        );
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Error generating response';
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          error: errorMsg,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Handler: Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Handler: Fallback to Gemini
  const handleFallbackToGemini = () => {
    const geminiDefault = AVAILABLE_MODELS.find((m) => m.id === 'gemini-2.5-flash') || AVAILABLE_MODELS[0];
    handleSelectModel(geminiDefault);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-text">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onExportMarkdown={exportConversationAsMarkdown}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNvidiaModal={() => setIsNvidiaModalOpen(true)}
        isNvidiaKeySet={isNvidiaKeySet}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModel={currentModel}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <ChatArea
          conversation={activeConversation}
          currentModel={currentModel}
          onSelectModel={handleSelectModel}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNvidiaModal={() => setIsNvidiaModalOpen(true)}
          isNvidiaKeySet={isNvidiaKeySet}
          settings={settings}
          onExportMarkdown={exportConversationAsMarkdown}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onExportAll={() => exportConversationsAsJSON(conversations)}
        onClearAll={() => {
          setConversations([]);
          setActiveId(null);
        }}
        onOpenNvidiaModal={() => {
          setIsSettingsOpen(false);
          setIsNvidiaModalOpen(true);
        }}
      />

      {/* NVIDIA NIM Key Setup Modal */}
      <NvidiaKeyModal
        isOpen={isNvidiaModalOpen}
        onClose={() => setIsNvidiaModalOpen(false)}
        currentKey={settings.nvidiaApiKey}
        onSaveKey={(key) => {
          setSettings((prev) => ({ ...prev, nvidiaApiKey: key }));
        }}
        onFallbackToGemini={handleFallbackToGemini}
      />
    </div>
  );
}
