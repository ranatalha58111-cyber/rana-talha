import React from 'react';
import { Menu, Settings } from 'lucide-react';
import { CoreVisual } from './CoreVisual';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSettings,
  isSettingsOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-[#080b14]/90 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Left side: Hamburger menu + Circular cyan JARVIS logo/orb + JARVIS + Small green status dot + Online */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          title="Toggle conversation sidebar"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent hover:border-white/[0.06] transition-all"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Circular cyan JARVIS logo/orb */}
        <div className="flex items-center gap-2.5">
          <CoreVisual size="sm" />

          {/* Text: JARVIS */}
          <span className="text-sm font-semibold tracking-wider text-white">
            JARVIS
          </span>

          {/* Small green status dot + Text: Online */}
          <div className="flex items-center gap-1.5 ml-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="text-xs text-zinc-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Right side: Settings gear icon + Circular user avatar */}
      <div className="flex items-center gap-3">
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          title="Settings"
          className={`p-2 rounded-xl transition-all border ${
            isSettingsOpen
              ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border-transparent hover:border-white/[0.06]'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Circular user avatar */}
        <div
          title="User Account"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-950 via-blue-900 to-indigo-900 border border-cyan-400/30 flex items-center justify-center text-xs font-semibold text-zinc-200 shadow-sm cursor-pointer hover:border-cyan-400/60 transition-colors"
        >
          <span className="text-xs font-medium text-cyan-200">U</span>
        </div>
      </div>
    </header>
  );
};
