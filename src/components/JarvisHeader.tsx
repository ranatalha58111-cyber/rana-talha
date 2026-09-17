import React from 'react';
import { User, LogIn } from 'lucide-react';
import { AuthUser } from '../types';

interface JarvisHeaderProps {
  isOnline?: boolean;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  activeMobileTab?: 'conversation' | 'core' | 'intel';
  onSelectMobileTab?: (tab: 'conversation' | 'core' | 'intel') => void;
  intelCount?: number;
}

export const JarvisHeader: React.FC<JarvisHeaderProps> = ({
  isOnline = true,
  currentUser = null,
  onOpenAuthModal,
  activeMobileTab = 'core',
  onSelectMobileTab,
  intelCount = 0,
}) => {
  return (
    <header className="h-[52px] min-h-[52px] w-full px-3 sm:px-6 bg-[#040711]/95 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between select-none z-30">
      {/* DESKTOP & TABLET: J . A . R . V . I . S (Hidden ONLY on mobile < sm) */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <h1 className="font-orbitron font-bold text-base sm:text-lg text-cyan-400 glow-cyan-sm tracking-[0.35em] whitespace-nowrap">
          J . A . R . V . I . S
        </h1>
      </div>

      {/* TAB CONTROLS: CHAT, CORE, INTEL (At the front on mobile, and next to title on preview/tablet) */}
      <div className="flex md:hidden items-center p-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-orbitron font-semibold tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.15)] shrink-0">
        {(['conversation', 'core', 'intel'] as const).map((tab) => {
          const isActive = activeMobileTab === tab;
          const label = tab === 'conversation' ? 'CHAT' : tab === 'core' ? 'CORE' : 'INTEL';
          return (
            <button
              key={tab}
              onClick={() => onSelectMobileTab && onSelectMobileTab(tab)}
              className={`px-2.5 sm:px-3 py-1 rounded-full uppercase transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-cyan-400/70 hover:text-cyan-200'
              }`}
            >
              <span>{label}</span>
              {tab === 'intel' && intelCount > 0 && (
                <span
                  className={`text-[8px] px-1 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-zinc-950 text-cyan-300' : 'bg-cyan-500/30 text-cyan-200'
                  }`}
                >
                  {intelCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RIGHT: User Auth & Online Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* SIGN IN OR ACTIVE USER PROFILE BUTTON */}
        {currentUser ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-[#07132a] hover:bg-[#0a1c3d] border border-cyan-400/40 text-[9px] sm:text-[11px] font-mono-tech tracking-wider text-cyan-200 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:border-cyan-300"
            title="User Profile & Identity Settings"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-200 truncate max-w-[70px] sm:max-w-[130px]">
              {currentUser.name}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 rounded-full bg-[#061124] hover:bg-[#0b1c3a] border border-cyan-500/40 text-[9px] sm:text-[11px] font-orbitron font-semibold tracking-wider text-cyan-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_16px_rgba(0,240,255,0.35)] hover:border-cyan-400"
            title="Sign in with your email and password"
          >
            <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
            <span>SIGN IN</span>
          </button>
        )}

        {/* ONLINE Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#060e1d] border border-cyan-500/25 text-[10px] sm:text-xs font-mono-tech tracking-widest text-cyan-400">
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-cyan-300 shadow-[0_0_8px_#00f0ff]' : 'bg-zinc-600'
              }`}
            />
          </span>
          <span className="font-semibold text-cyan-300 glow-cyan-sm">ONLINE</span>
        </div>
      </div>
    </header>
  );
};

