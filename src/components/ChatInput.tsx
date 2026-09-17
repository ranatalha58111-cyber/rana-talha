import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Plus, Mic, SendHorizontal, X, FileText } from 'lucide-react';
import { Attachment, VoiceState } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  voiceState: VoiceState;
  onToggleVoice: () => void;
  onStopSpeaking?: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  voiceState,
  onToggleVoice,
  onStopSpeaking,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';

  // Auto resize textarea up to max height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          type: 'image',
          mimeType: file.type,
          size: file.size,
          data: base64,
        });
      } else {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });

        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          type: 'document',
          mimeType: file.type || 'text/plain',
          size: file.size,
          text: textContent.slice(0, 50000),
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-1 select-none">
      {/* Voice State Status: Listening... / Thinking... / Speaking... */}
      {(isListening || isThinking || isSpeaking) && (
        <div className="flex items-center justify-center mb-3 animate-fade-in">
          <div
            onClick={() => {
              if (isSpeaking && onStopSpeaking) onStopSpeaking();
              if (isListening) onToggleVoice();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md cursor-pointer transition-all duration-300 ${
              isListening
                ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.18)]'
                : isThinking
                ? 'bg-zinc-900/80 text-zinc-300 border border-white/[0.08]'
                : 'bg-sky-950/40 text-sky-300 border border-sky-500/25 hover:bg-sky-900/40'
            }`}
          >
            {isListening && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <span className="tracking-wide">Listening...</span>
              </>
            )}
            {isThinking && (
              <>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="tracking-wide">Thinking...</span>
              </>
            )}
            {isSpeaking && (
              <>
                <span className="flex gap-0.5 items-center h-2.5">
                  <span className="w-0.5 h-2 bg-sky-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-sky-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="tracking-wide">Speaking...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2 animate-fade-in">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs text-zinc-200 shadow-sm"
            >
              {att.type === 'image' && att.data ? (
                <img
                  src={att.data}
                  alt={att.name}
                  className="w-4 h-4 rounded object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="truncate max-w-[120px] text-[11px] font-medium">
                {att.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Large Floating Rounded Input Container: small circular + | Ask JARVIS anything... | large circular cyan mic | circular send */}
      <div className="relative rounded-full bg-[#0d111d]/90 border border-white/[0.08] focus-within:border-cyan-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl px-3 py-1.5 flex items-center gap-2.5 sm:gap-3 transition-all duration-200">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html"
        />

        {/* Left: Small circular + button */}
        <button
          type="button"
          id="btn-attach-file"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file or image"
          className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.08] transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Center: placeholder: Ask JARVIS anything... */}
        <textarea
          ref={textareaRef}
          id="input-prompt"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask JARVIS anything..."
          className="flex-1 bg-transparent border-none outline-none resize-none text-zinc-100 placeholder:text-zinc-500 text-[14px] sm:text-[15px] max-h-28 py-2 px-1 font-sans leading-relaxed"
        />

        {/* Right: Large circular cyan microphone button (Most visually prominent control, subtle cyan glow) */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Subtle animated circular ring when active */}
          {isListening && (
            <>
              <span className="absolute -inset-1 rounded-full border border-cyan-400/50 animate-ping pointer-events-none opacity-40" />
              <span className="absolute -inset-2 rounded-full border border-cyan-400/30 animate-pulse pointer-events-none" />
            </>
          )}
          <button
            type="button"
            id="btn-voice-input"
            onClick={onToggleVoice}
            title={isListening ? 'Stop listening' : 'Voice conversation'}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-cyan-300 text-zinc-950 shadow-[0_0_22px_rgba(6,182,212,0.65)] scale-105'
                : 'bg-cyan-400 hover:bg-cyan-300 text-zinc-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:shadow-[0_0_22px_rgba(6,182,212,0.6)]'
            }`}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
          </button>
        </div>

        {/* Far Right: Circular send button with arrow icon */}
        <button
          type="button"
          id="btn-send-message"
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 border ${
            canSend
              ? 'bg-white text-zinc-950 hover:bg-zinc-200 border-white/20 shadow-sm cursor-pointer'
              : 'bg-zinc-900/60 text-zinc-600 border-white/[0.05] cursor-not-allowed'
          }`}
        >
          <SendHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
