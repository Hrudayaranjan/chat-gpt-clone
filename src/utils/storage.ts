import { AppSettings, Conversation } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'omnichat_conversations_v1',
  ACTIVE_ID: 'omnichat_active_id_v1',
  SETTINGS: 'omnichat_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  nvidiaApiKey: '',
  systemPrompt: 'You are OmniChat, a helpful, intelligent, truthful, and versatile AI assistant built with ChatGPT capabilities. Provide well-structured, clear, insightful, and markdown-formatted answers.',
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  theme: 'dark',
  autoScroll: true,
  soundEnabled: true,
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load conversations from localStorage:', e);
    return [];
  }
}

export function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
  } catch (e) {
    console.error('Failed to save conversations to localStorage:', e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (e) {
    console.error('Failed to save active conversation id:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function exportConversationsAsJSON(convs: Conversation[]) {
  const blob = new Blob([JSON.stringify(convs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnichat-conversations-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportConversationAsMarkdown(conv: Conversation) {
  let md = `# ${conv.title}\n\n`;
  md += `*Model: ${conv.model} (${conv.provider}) | Date: ${new Date(conv.createdAt).toLocaleString()}*\n\n---\n\n`;

  for (const msg of conv.messages) {
    const roleName = msg.role === 'user' ? '🧑 User' : '🤖 Assistant';
    md += `### ${roleName}\n\n`;
    if (msg.reasoningContent) {
      md += `> **Thought Process:**\n> ${msg.reasoningContent.replace(/\n/g, '\n> ')}\n\n`;
    }
    md += `${msg.content}\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'chat'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
