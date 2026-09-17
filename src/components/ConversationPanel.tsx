import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Square } from 'lucide-react';
import { Message } from '../types';

interface ConversationPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  userName?: string;
}

export const ConversationPanel = React.memo<ConversationPanelProps>(({
  messages,
  onSendMessage,
  isLoading = false,
  userName,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#040711]/60 border-r border-cyan-500/20 select-none">
      {/* Top Heading: ◻ CONVERSATION */}
      <div className="h-10 px-4 flex items-center border-b border-cyan-500/15 shrink-0">
        <div className="flex items-center gap-2">
          <Square className="w-3 h-3 text-cyan-400 stroke-[2.5]" />
          <span className="font-orbitron text-xs font-semibold text-cyan-400 tracking-[0.25em] uppercase glow-cyan-sm">
            CONVERSATION
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center px-3 select-none">
            <p className="text-xs sm:text-sm text-cyan-200/50 font-rajdhani font-medium leading-relaxed max-w-[200px]">
              Say &quot;Jarvis&quot; or type below to begin.
            </p>
            <p className="text-[11px] sm:text-xs text-cyan-400/40 font-rajdhani mt-2 leading-relaxed max-w-[200px]">
              English, Urdu, and Roman Urdu supported.
            </p>
          </div>
        ) : (
          /* Conversation Messages */
          <div className="space-y-3">
            {messages.map((msg) => {
              const isUser = msg.role === 'user' || (msg as any).sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-mono-tech tracking-wider text-cyan-500/60 mb-0.5 uppercase">
                    {isUser ? (userName ? userName.toUpperCase() : 'USER') : 'J.A.R.V.I.S'}
                  </span>
                  <div
                    className={`max-w-[92%] p-2.5 rounded-xl text-xs sm:text-[13px] font-rajdhani leading-relaxed ${
                      isUser
                        ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-[#060c1a]/80 text-zinc-200 border border-cyan-500/20 shadow-sm'
                    }`}
                  >
                    {msg.content || (msg as any).text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#060c1a]/60 border border-cyan-500/20 text-cyan-400 text-xs font-mono-tech">
                <span className="animate-pulse">JARVIS is computing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Input Area at Bottom */}
      <div className="p-3 border-t border-cyan-500/15 bg-[#03060f]/90 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-[#070e1e] border border-cyan-500/30 focus-within:border-cyan-400/70 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.25)] rounded-full px-3.5 py-1.5 transition-all duration-200"
        >
          <input
            id="input-conversation-message"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-100 placeholder-cyan-500/40 font-rajdhani pr-2"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
              inputText.trim() && !isLoading
                ? 'bg-cyan-400 text-zinc-950 hover:bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)] cursor-pointer'
                : 'bg-cyan-950/40 text-cyan-500/40 cursor-not-allowed'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5 stroke-[2.3]" />
          </button>
        </form>
      </div>
    </div>
  );
});

ConversationPanel.displayName = 'ConversationPanel';
