import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  Cpu,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import { Conversation, ModelInfo } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onExportMarkdown: (conv: Conversation) => void;
  onOpenSettings: () => void;
  onOpenNvidiaModal: () => void;
  isNvidiaKeySet: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  currentModel: ModelInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onExportMarkdown,
  onOpenSettings,
  onOpenNvidiaModal,
  isNvidiaKeySet,
  isOpen,
  onToggleOpen,
  currentModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group conversations by time
  const groupedConversations = useMemo(() => {
    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 86400000 * 7;

    for (const conv of filteredConversations) {
      if (conv.isPinned) {
        pinned.push(conv);
        continue;
      }

      const time = conv.updatedAt || conv.createdAt;
      if (time >= todayStart) {
        today.push(conv);
      } else if (time >= yesterdayStart) {
        yesterday.push(conv);
      } else if (time >= sevenDaysStart) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    }

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredConversations]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-zinc-950 border-r border-zinc-800/80 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64 sm:w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 px-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              OmniChat <span className="text-[10px] text-emerald-400 font-mono">v2.5</span>
            </span>
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-100 text-sm font-medium transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span>New chat</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              ⌘K
            </span>
          </button>
        </div>

        {/* Search Chats Input */}
        {conversations.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs select-none">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p>No conversations yet.</p>
              <p className="text-[11px] text-zinc-600">Start asking questions or brainstorm ideas!</p>
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {groupedConversations.pinned.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold text-[11px] text-amber-400/80 uppercase tracking-wider flex items-center space-x-1.5">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </div>
                  {groupedConversations.pinned.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onSelect={() => onSelectConversation(conv.id)}
                      onStartRename={(e) => handleStartRename(conv, e)}
                      onSaveRename={(e) => handleSaveRename(conv.id, e)}
                      onCancelRename={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      onExportMarkdown={(e) => {
                        e.stopPropagation();
                        onExportMarkdown(conv);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Today */}
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold text-[11px] text-zinc-500 uppercase tracking-wider">
                    Today
                  </div>
                  {groupedConversations.today.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onSelect={() => onSelectConversation(conv.id)}
                      onStartRename={(e) => handleStartRename(conv, e)}
                      onSaveRename={(e) => handleSaveRename(conv.id, e)}
                      onCancelRename={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      onExportMarkdown={(e) => {
                        e.stopPropagation();
                        onExportMarkdown(conv);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold text-[11px] text-zinc-500 uppercase tracking-wider">
                    Yesterday
                  </div>
                  {groupedConversations.yesterday.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onSelect={() => onSelectConversation(conv.id)}
                      onStartRename={(e) => handleStartRename(conv, e)}
                      onSaveRename={(e) => handleSaveRename(conv.id, e)}
                      onCancelRename={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      onExportMarkdown={(e) => {
                        e.stopPropagation();
                        onExportMarkdown(conv);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Previous 7 Days */}
              {groupedConversations.last7Days.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold text-[11px] text-zinc-500 uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  {groupedConversations.last7Days.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onSelect={() => onSelectConversation(conv.id)}
                      onStartRename={(e) => handleStartRename(conv, e)}
                      onSaveRename={(e) => handleSaveRename(conv.id, e)}
                      onCancelRename={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      onExportMarkdown={(e) => {
                        e.stopPropagation();
                        onExportMarkdown(conv);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Older */}
              {groupedConversations.older.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold text-[11px] text-zinc-500 uppercase tracking-wider">
                    Older
                  </div>
                  {groupedConversations.older.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      onSelect={() => onSelectConversation(conv.id)}
                      onStartRename={(e) => handleStartRename(conv, e)}
                      onSaveRename={(e) => handleSaveRename(conv.id, e)}
                      onCancelRename={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      onExportMarkdown={(e) => {
                        e.stopPropagation();
                        onExportMarkdown(conv);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Platform Status & Settings Bar */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 space-y-2">
          {/* Active Model Indicator */}
          <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              {currentModel.provider === 'nvidia' ? (
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
              <span className="truncate text-zinc-300 font-medium">{currentModel.name}</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                currentModel.provider === 'nvidia'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}
            >
              {currentModel.provider === 'nvidia' ? 'NVIDIA' : 'GEMINI'}
            </span>
          </div>

          {/* Quick NVIDIA Key config status button */}
          <button
            onClick={onOpenNvidiaModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>NVIDIA NIM Key</span>
            </div>
            <span
              className={`text-[10px] ${
                isNvidiaKeySet ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {isNvidiaKeySet ? 'Active ●' : 'Add Key'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings & Preferences</span>
          </button>
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent | React.FormEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onExportMarkdown: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  isActive,
  editingId,
  editTitle,
  setEditTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDelete,
  onExportMarkdown,
}) => {
  const isEditing = editingId === conv.id;

  if (isEditing) {
    return (
      <form
        onSubmit={onSaveRename}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-zinc-900 border border-emerald-500/50"
      >
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
          className="flex-1 bg-transparent text-xs text-zinc-100 focus:outline-none"
        />
        <button
          type="submit"
          onClick={onSaveRename}
          className="p-1 hover:text-emerald-400 text-zinc-400"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="p-1 hover:text-red-400 text-zinc-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 my-0.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-zinc-800 text-zinc-100 font-medium'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      }`}
    >
      <div className="flex items-center space-x-2 truncate pr-2">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
          }`}
        />
        <span className="truncate text-xs">{conv.title || 'Untitled Chat'}</span>
      </div>

      {/* Action buttons on hover / active */}
      <div
        className={`flex items-center space-x-1 shrink-0 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity`}
      >
        <button
          onClick={onTogglePin}
          title={conv.isPinned ? 'Unpin' : 'Pin'}
          className="p-1 hover:text-amber-400 text-zinc-500 rounded hover:bg-zinc-700/50"
        >
          <Pin className={`w-3 h-3 ${conv.isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
        </button>

        <button
          onClick={onStartRename}
          title="Rename"
          className="p-1 hover:text-zinc-200 text-zinc-500 rounded hover:bg-zinc-700/50"
        >
          <Edit2 className="w-3 h-3" />
        </button>

        <button
          onClick={onExportMarkdown}
          title="Export Markdown"
          className="p-1 hover:text-emerald-400 text-zinc-500 rounded hover:bg-zinc-700/50"
        >
          <Download className="w-3 h-3" />
        </button>

        <button
          onClick={onDelete}
          title="Delete"
          className="p-1 hover:text-red-400 text-zinc-500 rounded hover:bg-zinc-700/50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
