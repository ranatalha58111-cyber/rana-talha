import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Copy,
  Check,
  Volume2,
  Globe,
  Clock,
  CloudSun,
  Database,
  Terminal,
  FileText,
} from 'lucide-react';
import { Message, SystemAutomation } from '../types';
import { CoreVisual } from './CoreVisual';

interface ChatMessageProps {
  message: Message;
  assistantName?: string;
  onSpeak: (text: string) => void;
  onConfirmAutomation?: (messageId: string, automation: SystemAutomation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  onConfirmAutomation,
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // User Message: Appears cleanly on the right
  if (!isAssistant) {
    return (
      <div className="flex flex-col items-end w-full animate-fade-in">
        <div className="max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-md bg-zinc-800/90 border border-white/[0.08] px-4 py-3 text-zinc-100 shadow-sm">
          {/* User Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.08] text-xs text-zinc-200"
                >
                  {att.mimeType.startsWith('image/') && att.data ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-6 h-6 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[130px] text-[11px] font-medium">
                    {att.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* User Message Text */}
          <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words font-sans">
            {message.content}
          </div>
        </div>

        <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">
          {formatTime(message.timestamp)}
        </span>
      </div>
    );
  }

  // JARVIS Response: Appears on the left with small simple JARVIS Core icon
  return (
    <div className="flex items-start gap-3 w-full max-w-3xl animate-fade-in group">
      {/* Small Simple JARVIS Core Icon */}
      <div className="shrink-0 mt-0.5 select-none">
        <CoreVisual size="sm" />
      </div>

      {/* Response Body */}
      <div className="flex-1 min-w-0">
        {/* Tool Call Badges (if any) */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.toolCalls.map((tool, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-white/[0.06] text-zinc-400 text-[11px] font-mono"
              >
                {tool.name === 'searchWeb' && <Globe className="w-3 h-3 text-cyan-400" />}
                {tool.name === 'getCurrentTime' && <Clock className="w-3 h-3 text-cyan-400" />}
                {tool.name === 'getWeather' && <CloudSun className="w-3 h-3 text-cyan-400" />}
                {tool.name === 'saveMemory' && <Database className="w-3 h-3 text-cyan-400" />}
                {tool.name === 'systemAutomation' && <Terminal className="w-3 h-3 text-cyan-400" />}
                <span className="truncate max-w-[200px]">
                  {tool.name === 'searchWeb'
                    ? `Searched web: ${tool.args?.query || ''}`
                    : tool.name === 'getCurrentTime'
                    ? `Checked time`
                    : tool.name === 'getWeather'
                    ? `Retrieved weather`
                    : tool.name === 'saveMemory'
                    ? `Saved note`
                    : `Command`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content Container */}
        <div className="rounded-2xl rounded-tl-md bg-zinc-900/40 border border-white/[0.06] px-4 py-3.5 text-zinc-200 shadow-sm">
          <div className="prose prose-invert max-w-none text-[14.5px] leading-relaxed break-words font-sans">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-cyan-300 font-mono text-[12.5px] border border-white/[0.06]"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-[#07080d]">
                      <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-white/[0.06] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                        <span>Code</span>
                      </div>
                      <pre className="p-3 text-[12.5px] font-mono overflow-x-auto text-zinc-200 leading-normal">
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  );
                },
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                h1: ({ children }) => <h1 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold text-white mt-2.5 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-semibold text-white mt-2 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-cyan-500/40 pl-3 my-2 italic text-zinc-400">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Message Actions (Copy, Speak) */}
        <div className="flex items-center gap-2 mt-1.5 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onSpeak(message.content)}
            title="Read aloud"
            className="p-1 text-zinc-400 hover:text-cyan-300 rounded transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy response"
            className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};
