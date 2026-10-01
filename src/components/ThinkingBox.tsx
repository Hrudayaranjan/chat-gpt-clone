import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit, Sparkles } from 'lucide-react';

interface ThinkingBoxProps {
  content: string;
  isStreaming?: boolean;
}

export const ThinkingBox: React.FC<ThinkingBoxProps> = ({ content, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="mb-3 rounded-lg border border-purple-900/30 bg-purple-950/20 dark:border-purple-800/40 dark:bg-purple-950/20 text-xs text-purple-300 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-purple-200">
            {isStreaming ? 'Thinking...' : 'Reasoning Process'}
          </span>
          {isStreaming && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 text-purple-400">
          <span className="text-[11px] opacity-80">{isOpen ? 'Hide' : 'Show thoughts'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-purple-900/20 text-purple-200/90 font-mono text-[12px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          <div className="flex items-center space-x-1.5 text-purple-400 mb-2 font-sans font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chain-of-thought exploration</span>
          </div>
          {content}
        </div>
      )}
    </div>
  );
};
