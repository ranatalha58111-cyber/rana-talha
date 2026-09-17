import React from 'react';
import { X, Monitor, Cpu, Download, CheckCircle2, Terminal, Volume2, ShieldCheck } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLocalBridgeOnline: boolean;
  onDownloadShortcut: () => void;
  onDownloadBridge: () => void;
  onDownloadStartupRoutine?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  isLocalBridgeOnline,
  onDownloadShortcut,
  onDownloadBridge,
  onDownloadStartupRoutine,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#070d18] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-sm sm:text-base text-cyan-300 tracking-wider">
                JARVIS DOWNLOAD & STARTUP ROUTINE CENTER
              </h2>
              <p className="text-xs text-zinc-400">
                Choose between Instant Desktop Shortcut, Startup Sound Routine, or Full PC Bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 3 Download Options */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          {/* OPTION 1: Simple Desktop Shortcut */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-[#0a1426] to-[#060e1c] border border-cyan-500/25 hover:border-cyan-400/50 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
                  Option 1 • 1-Click
                </span>
                <Monitor className="w-5 h-5 text-cyan-400" />
              </div>

              <h3 className="font-orbitron font-bold text-base text-zinc-100 mb-1">
                Desktop Shortcut
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Instant Windows launcher (<code className="text-cyan-300 font-mono">.bat</code>). Places a dedicated JARVIS icon on your Desktop in clean app mode.
              </p>

              <div className="space-y-1.5 text-[11px] text-zinc-300 font-mono mb-5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>No installation required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Desktop icon auto-creation</span>
                </div>
              </div>
            </div>

            <button
              onClick={onDownloadShortcut}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 font-orbitron font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>DOWNLOAD SHORTCUT</span>
            </button>
          </div>

          {/* OPTION 2: Startup Sound & Routine */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-[#0a1426] to-[#060e1c] border border-cyan-500/25 hover:border-cyan-300/60 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 font-semibold">
                  Option 2 • Audio Routine
                </span>
                <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>

              <h3 className="font-orbitron font-bold base text-zinc-100 mb-1">
                Startup Sound Package
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Real Jarvis startup sound (<code className="text-cyan-300 font-mono">.wav</code>) + automated startup routine scripts (<code className="text-cyan-300 font-mono">.bat</code> / <code className="text-cyan-300 font-mono">.py</code>).
              </p>

              <div className="space-y-1.5 text-[11px] text-zinc-300 font-mono mb-5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span>Authentic Stark WAV audio cue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span>Auto-plays on local app launch</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onDownloadStartupRoutine) {
                  onDownloadStartupRoutine();
                } else {
                  window.location.href = '/api/download/startup-routine';
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-100 font-orbitron font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            >
              <Download className="w-4 h-4 text-cyan-200" />
              <span>DOWNLOAD STARTUP SOUND</span>
            </button>
          </div>

          {/* OPTION 3: Local Companion Bridge */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-[#0a1426] to-[#060e1c] border border-cyan-500/25 hover:border-emerald-400/50 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-semibold border ${
                  isLocalBridgeOnline 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                }`}>
                  Option 3 • PC Bridge
                </span>
                <Cpu className={`w-5 h-5 ${isLocalBridgeOnline ? 'text-emerald-400' : 'text-cyan-400'}`} />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-orbitron font-bold text-base text-zinc-100">
                  Local PC Bridge
                </h3>
                {isLocalBridgeOnline && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    ONLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Companion bridge (<code className="text-cyan-300 font-mono">JARVIS-Bridge.zip</code>). Allows JARVIS to launch desktop software natively.
              </p>

              <div className="space-y-1.5 text-[11px] text-zinc-300 font-mono mb-5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Launches Chrome, VS Code, Apps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Secure local port (41199)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onDownloadBridge}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 hover:border-emerald-300 text-emerald-200 font-orbitron font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>DOWNLOAD BRIDGE</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>All startup routines and audio cues generated automatically</span>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
