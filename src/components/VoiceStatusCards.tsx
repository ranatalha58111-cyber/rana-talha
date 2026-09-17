import React from 'react';
import { Mic, Activity, CheckCircle2 } from 'lucide-react';
import { VoiceState } from '../types';

interface VoiceStatusCardsProps {
  voiceState: VoiceState;
  onSelectState?: (state: VoiceState) => void;
  onToggleVoice?: () => void;
  onStopSpeaking?: () => void;
}

export const VoiceStatusCards: React.FC<VoiceStatusCardsProps> = ({
  voiceState,
  onSelectState,
  onToggleVoice,
  onStopSpeaking,
}) => {
  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking' || voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';
  const isReady = voiceState === 'ready' || (!isListening && !isThinking && !isSpeaking);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 select-none">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Card 1: Listening... */}
        <button
          type="button"
          onClick={() => {
            if (onToggleVoice) onToggleVoice();
            if (onSelectState) onSelectState('listening');
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
            isListening
              ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.22)] font-medium'
              : 'bg-[#0b101c]/70 hover:bg-[#101728]/80 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {isListening && (
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 opacity-60" />
            )}
            <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-cyan-400' : 'text-zinc-400'}`} />
          </div>
          <span className="tracking-wide">Listening...</span>
        </button>

        {/* Card 2: Thinking... */}
        <button
          type="button"
          onClick={() => {
            if (onSelectState) onSelectState('thinking');
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
            isThinking
              ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.22)] font-medium'
              : 'bg-[#0b101c]/70 hover:bg-[#101728]/80 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {/* Three animated dots */}
          <span className="flex gap-1 items-center">
            <span
              className={`w-1 h-1 rounded-full ${
                isThinking ? 'bg-cyan-400 animate-bounce' : 'bg-zinc-400'
              }`}
              style={{ animationDelay: '0ms' }}
            />
            <span
              className={`w-1 h-1 rounded-full ${
                isThinking ? 'bg-cyan-400 animate-bounce' : 'bg-zinc-400'
              }`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-1 h-1 rounded-full ${
                isThinking ? 'bg-cyan-400 animate-bounce' : 'bg-zinc-400'
              }`}
              style={{ animationDelay: '300ms' }}
            />
          </span>
          <span className="tracking-wide">Thinking...</span>
        </button>

        {/* Card 3: Speaking... */}
        <button
          type="button"
          onClick={() => {
            if (isSpeaking && onStopSpeaking) {
              onStopSpeaking();
            } else if (onSelectState) {
              onSelectState('speaking');
            }
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
            isSpeaking
              ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.22)] font-medium'
              : 'bg-[#0b101c]/70 hover:bg-[#101728]/80 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {/* Small audio waveform */}
          <div className="flex items-center gap-0.5 h-3">
            <span
              className={`w-0.5 rounded-full ${
                isSpeaking ? 'h-2 bg-cyan-400 animate-pulse' : 'h-1.5 bg-zinc-400'
              }`}
            />
            <span
              className={`w-0.5 rounded-full ${
                isSpeaking ? 'h-3 bg-cyan-300 animate-pulse' : 'h-2.5 bg-zinc-400'
              }`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-0.5 rounded-full ${
                isSpeaking ? 'h-2 bg-cyan-400 animate-pulse' : 'h-1.5 bg-zinc-400'
              }`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="tracking-wide">Speaking...</span>
        </button>

        {/* Card 4: Ready */}
        <button
          type="button"
          onClick={() => {
            if (onStopSpeaking) onStopSpeaking();
            if (onSelectState) onSelectState('ready');
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
            isReady
              ? 'bg-[#0c1524]/90 border-cyan-500/35 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.12)] font-medium'
              : 'bg-[#0b101c]/70 hover:bg-[#101728]/80 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isReady ? 'text-cyan-400' : 'text-zinc-400'}`} />
          <span className="tracking-wide">Ready</span>
        </button>
      </div>
    </div>
  );
};
