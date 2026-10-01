import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // Parse content into blocks: code blocks vs standard markdown
  // This allows rendering custom Interactive Code Blocks with Copy buttons and language tags
  const renderedContent = useMemo(() => {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    try {
      return marked.parse(content) as string;
    } catch (e) {
      console.error('Failed to parse markdown:', e);
      return content;
    }
  }, [content]);

  return (
    <div className="relative text-inherit leading-relaxed space-y-3 prose dark:prose-invert max-w-none break-words">
      {/* Dynamic content rendering with custom code block interceptor */}
      <CustomMarkdownViewer htmlContent={renderedContent} rawContent={content} />
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
      )}
    </div>
  );
};

// Component to handle code block copying and enhanced presentation
const CustomMarkdownViewer: React.FC<{ htmlContent: string; rawContent: string }> = ({ rawContent }) => {
  // Split raw content by code blocks ```lang ... ```
  const parts = useMemo(() => {
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const items: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawContent)) !== null) {
      if (match.index > lastIndex) {
        items.push({
          type: 'text',
          content: rawContent.slice(lastIndex, match.index),
        });
      }

      items.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].replace(/\n$/, ''),
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawContent.length) {
      items.push({
        type: 'text',
        content: rawContent.slice(lastIndex),
      });
    }

    return items;
  }, [rawContent]);

  if (parts.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: marked.parse(rawContent) as string }} />;
  }

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlockItem
              key={index}
              code={part.content}
              language={part.language || 'plaintext'}
            />
          );
        }

        const parsedHtml = marked.parse(part.content) as string;
        return (
          <div
            key={index}
            className="chat-markdown-body"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        );
      })}
    </div>
  );
};

interface CodeBlockItemProps {
  code: string;
  language: string;
}

const CodeBlockItem: React.FC<CodeBlockItemProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-950 text-zinc-100 font-mono text-sm shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold uppercase tracking-wider">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-zinc-200 selection:bg-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  );
};
