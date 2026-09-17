import React from 'react';

interface CoreVisualProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoreVisual: React.FC<CoreVisualProps> = ({
  size = 'md',
  className = '',
}) => {
  if (size === 'sm') {
    return (
      <div
        className={`relative flex items-center justify-center select-none w-6 h-6 shrink-0 ${className}`}
      >
        <div className="absolute inset-0 rounded-full border border-cyan-400/40 bg-cyan-950/30" />
        <div className="relative flex items-center justify-center rounded-full bg-[#070b14] border border-cyan-300/60 w-3.5 h-3.5 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`relative flex items-center justify-center select-none w-20 h-20 sm:w-24 sm:h-24 ${className}`}
      >
        {/* Ambient soft glow */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-transparent blur-xl pointer-events-none" />

        {/* Slow Pulsing Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/25 animate-orb-pulse" />

        {/* Middle geometric ring with dashed / segmented feel */}
        <div className="absolute inset-2 rounded-full border border-cyan-400/35 border-dashed" />

        {/* Inner high-contrast dark orb with radiant core */}
        <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#090e1a] border border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.35)]">
          {/* Inner ring */}
          <div className="w-8 h-8 rounded-full border border-cyan-300/40 flex items-center justify-center bg-cyan-950/50">
            {/* Glowing Nucleus */}
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)]" />
          </div>
        </div>
      </div>
    );
  }

  // size === 'md'
  return (
    <div
      className={`relative flex items-center justify-center select-none w-10 h-10 ${className}`}
    >
      <div className="absolute inset-0 rounded-full border border-cyan-500/25 bg-cyan-950/20" />
      <div className="relative flex items-center justify-center rounded-full bg-[#0a0d14] border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.25)] w-6 h-6">
        <div className="rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] w-2.5 h-2.5" />
      </div>
    </div>
  );
};
