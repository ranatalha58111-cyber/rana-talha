import React, { useState, useMemo } from 'react';
import { VoiceState } from '../types';
import { playJarvisPulse } from '../utils/audioEffects';
import { playRealJarvisStartupSound } from '../utils/jarvisAudioPlayer';

interface JarvisCoreProps {
  voiceState: VoiceState;
  onCoreClick: () => void;
}

// Precomputed static HUD radial ticks to eliminate render overhead
const RADIAL_TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

export const JarvisCore = React.memo<JarvisCoreProps>(({
  voiceState,
  onCoreClick,
}) => {
  const [coreRipple, setCoreRipple] = useState(false);

  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking' || voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';

  // Handle clicking the central core directly
  const handleCoreClick = () => {
    setCoreRipple(true);
    setTimeout(() => setCoreRipple(false), 700);
    playJarvisPulse();
    playRealJarvisStartupSound();
    onCoreClick();
  };

  return (
    <div className="JarvisCore flex-1 flex flex-col items-center justify-center py-6 px-4 w-full max-w-2xl mx-auto select-none min-h-0">
      {/* Primary Animated AI Sphere & HUD Hologram - Exclusively Centered */}
      <div className="relative flex items-center justify-center my-auto py-2 shrink-0">
        {/* Ambient Cyan Glow Backlight - GPU Accelerated with optimized radial gradient */}
        <div
          className={`absolute rounded-full transition-all duration-300 pointer-events-none transform-gpu will-change-transform ${
            isListening
              ? 'w-60 h-60 sm:w-72 sm:h-72 bg-cyan-400/20 shadow-[0_0_50px_rgba(0,240,255,0.25)]'
              : isThinking
              ? 'w-52 h-52 sm:w-64 sm:h-64 bg-cyan-500/15 shadow-[0_0_40px_rgba(0,240,255,0.2)]'
              : isSpeaking
              ? 'w-60 h-60 sm:w-72 sm:h-72 bg-cyan-300/20 shadow-[0_0_55px_rgba(0,240,255,0.3)]'
              : 'w-48 h-48 sm:w-60 sm:h-60 bg-cyan-400/10 shadow-[0_0_30px_rgba(0,240,255,0.15)]'
          }`}
        />

        {/* Clickable AI Core Sphere */}
        <button
          type="button"
          id="btn-jarvis-core"
          onClick={handleCoreClick}
          title="Click to interact or speak"
          className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center cursor-pointer group outline-none focus:outline-none transition-transform active:scale-95 transform-gpu"
        >
          {/* Outermost Segmented Technical Ring (Rotating Clockwise) */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-slow opacity-90 transform-gpu will-change-transform"
            viewBox="0 0 280 280"
            fill="none"
          >
            <circle
              cx="140"
              cy="140"
              r="134"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeDasharray="4 8 1 8 12 12"
              strokeOpacity="0.85"
            />
            {/* Corner alignment marks */}
            <path
              d="M140 2 L140 12 M140 268 L140 278 M2 140 L12 140 M268 140 L278 140"
              stroke="#00f0ff"
              strokeWidth="2.2"
              strokeOpacity="1"
            />
            <path
              d="M46 46 L56 56 M234 234 L224 224 M234 46 L224 56 M46 234 L56 224"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeOpacity="0.9"
            />
          </svg>

          {/* Secondary Counter-Rotating Dash Ring */}
          <svg
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-spin-reverse-slow opacity-90 transform-gpu will-change-transform"
            viewBox="0 0 264 264"
            fill="none"
          >
            <circle
              cx="132"
              cy="132"
              r="124"
              stroke="#00f0ff"
              strokeWidth="1.6"
              strokeDasharray="40 10 15 10 60 12"
              strokeOpacity="0.85"
            />
            {/* Precalculated Radial ticks */}
            {RADIAL_TICKS.map((angle, i) => (
              <line
                key={i}
                x1="132"
                y1="8"
                x2="132"
                y2="15"
                stroke="#00f0ff"
                strokeWidth="1.6"
                strokeOpacity="0.85"
                transform={`rotate(${angle} 132 132)`}
              />
            ))}
          </svg>

          {/* Concentric Circular Technical Ring */}
          <div className="absolute inset-8 rounded-full border-2 border-cyan-400/80 shadow-[0_0_16px_rgba(0,240,255,0.45)] flex items-center justify-center transition-all group-hover:border-cyan-300">
            {/* Segmented Inner Arc Ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-300/90" />

            {/* Inner Circular Frame with deep shadow and glowing border */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-cyan-300 bg-[#040814]/95 flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,240,255,0.5),0_0_25px_rgba(0,240,255,0.4)] group-hover:shadow-[inset_0_0_35px_rgba(0,240,255,0.7),0_0_35px_rgba(0,240,255,0.6)] transition-all">
              {/* Inner Crosshair Ticks */}
              <div className="absolute inset-1 rounded-full border border-cyan-300/60 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full relative">
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#00f0ff]" />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#00f0ff]" />
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#00f0ff]" />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#00f0ff]" />
                </div>
              </div>

              {/* Dynamic Click Ripple Ring */}
              {coreRipple && (
                <span className="absolute inset-0 rounded-full border-2 border-cyan-200 animate-ping opacity-90 pointer-events-none" />
              )}

              {/* Central Glowing Orb / Nucleus */}
              <div
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? 'w-18 h-18 sm:w-22 sm:h-22 bg-cyan-400/50 border-2 border-cyan-100 animate-core-listening shadow-[0_0_45px_#00f0ff]'
                    : isThinking
                    ? 'w-16 h-16 sm:w-20 sm:h-20 bg-cyan-400/40 border-2 border-cyan-200 animate-pulse shadow-[0_0_40px_#00f0ff]'
                    : isSpeaking
                    ? 'w-18 h-18 sm:w-22 sm:h-22 bg-cyan-300/50 border-2 border-white animate-core-pulse shadow-[0_0_50px_#00f0ff]'
                    : 'w-16 h-16 sm:w-20 sm:h-20 bg-cyan-400/35 border-2 border-cyan-300 animate-core-pulse group-hover:scale-105 shadow-[0_0_35px_#00f0ff]'
                }`}
              >
                {/* Nucleus Core Ring */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-200 bg-cyan-950 flex items-center justify-center shadow-[inset_0_0_15px_#00f0ff,0_0_18px_#00f0ff]">
                  {/* Glowing Pure Center */}
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      isListening
                        ? 'w-5 h-5 bg-white shadow-[0_0_24px_#ffffff,0_0_40px_#00f0ff]'
                        : isSpeaking
                        ? 'w-5 h-5 bg-white shadow-[0_0_20px_#ffffff,0_0_35px_#00f0ff]'
                        : 'w-4 h-4 bg-white shadow-[0_0_16px_#ffffff,0_0_28px_#00f0ff]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

JarvisCore.displayName = 'JarvisCore';
