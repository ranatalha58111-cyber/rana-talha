import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 sm:w-72 bg-[#090c16]/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Section */}
      <div className="p-4 space-y-3.5 border-b border-white/[0.04]">
        {/* Large Rounded Button: + New Chat */}
        <button
          id="btn-sidebar-new-chat"
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 text-white border border-cyan-500/25 hover:border-cyan-400/50 shadow-[0_2px_12px_rgba(6,182,212,0.12)] flex items-center justify-center gap-2.5 text-sm font-medium transition-all duration-200 group"
        >
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-colors">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="tracking-wide">New Chat</span>
        </button>

        {/* Search field: Search conversations... */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-search-conversations"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-white/[0.06] focus:border-cyan-500/40 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Section Title: Recent */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Recent
        </span>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.12)] font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />

                <div className="flex-1 min-w-0 pr-1">
                  <p className="truncate leading-relaxed">{conv.title}</p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{conv.timestampLabel || 'Recent'}</span>
                  </div>
                </div>

                {onDeleteConversation && conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800/60 transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
