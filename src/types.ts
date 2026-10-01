export type ProviderType = 'gemini' | 'nvidia';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
  content?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  timestamp: number;
  model?: string;
  provider?: ProviderType;
  attachments?: Attachment[];
  error?: string;
  isStreaming?: boolean;
  latencyMs?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  model: string;
  provider: ProviderType;
  systemPrompt?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  badge: string;
  description: string;
  category: 'Flagship' | 'Reasoning' | 'Coding & Fast' | 'NVIDIA Special';
  supportsThinking?: boolean;
  contextLength: string;
  isDefault?: boolean;
}

export interface AppSettings {
  provider: ProviderType;
  model: string;
  nvidiaApiKey: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  theme: 'dark' | 'light' | 'system';
  autoScroll: boolean;
  soundEnabled: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // Google Gemini Models
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    badge: 'Fast & Versatile',
    description: 'Next-gen multimodal workhorse model, ultra-low latency & 1M context.',
    category: 'Flagship',
    supportsThinking: true,
    contextLength: '1M tokens',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    badge: 'Deep Reasoning',
    description: 'Advanced reasoning, deep problem solving, complex coding, and multimodal analysis.',
    category: 'Reasoning',
    supportsThinking: true,
    contextLength: '2M tokens',
  },

  // NVIDIA NIM Models (Run via NVIDIA API Key)
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'nvidia',
    badge: 'NVIDIA • Reasoning King',
    description: 'Revolutionary open reasoning model with transparent chain-of-thought exploration.',
    category: 'Reasoning',
    supportsThinking: true,
    contextLength: '64k tokens',
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'nvidia',
    badge: 'NVIDIA • Flagship',
    description: "Meta's flagship open-weights instruct model with near 405B capabilities.",
    category: 'Flagship',
    supportsThinking: false,
    contextLength: '128k tokens',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B',
    provider: 'nvidia',
    badge: 'NVIDIA • High Accuracy',
    description: 'Custom fine-tuned by NVIDIA for top benchmark reasoning and helpfulness.',
    category: 'NVIDIA Special',
    supportsThinking: false,
    contextLength: '128k tokens',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2',
    provider: 'nvidia',
    badge: 'NVIDIA • Multilingual & Code',
    description: 'Top-tier code generation, logic reasoning, and multilingual proficiencies.',
    category: 'Coding & Fast',
    supportsThinking: false,
    contextLength: '128k tokens',
  },
];
