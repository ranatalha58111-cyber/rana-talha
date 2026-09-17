import React, { useState } from 'react';
import { X, Sliders, Volume2, Cpu, Brain, Shield } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

type SettingsTab = 'General' | 'Voice' | 'AI' | 'Memory' | 'Privacy';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'General', label: 'General', icon: Sliders },
    { id: 'Voice', label: 'Voice', icon: Volume2 },
    { id: 'AI', label: 'AI', icon: Cpu },
    { id: 'Memory', label: 'Memory', icon: Brain },
    { id: 'Privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <aside
      className="fixed lg:static inset-y-0 right-0 z-40 w-80 sm:w-96 bg-[#090c16]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col transition-all duration-300 select-none"
    >
      {/* Header: Settings + Close X Button */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Settings
          </h2>
        </div>
        <button
          id="btn-close-settings"
          onClick={onClose}
          title="Close settings"
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Two-Column Settings Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Column */}
        <div className="w-28 sm:w-32 border-r border-white/[0.06] p-2 space-y-1 bg-[#070a12]/50">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                  isSelected
                    ? 'bg-cyan-950/50 text-cyan-300 border-l-2 border-cyan-400 font-medium shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Column */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5">
          {activeTab === 'General' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                General
              </h3>

              {/* Setting: Language -> Dropdown: English */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Language
                </label>
                <div className="relative">
                  <select
                    id="select-language"
                    value={settings.language || 'English'}
                    onChange={(e) => onUpdateSettings({ language: e.target.value })}
                    className="w-full bg-[#0c121e] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer transition-colors"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Japanese">日本語</option>
                  </select>
                </div>
              </div>

              {/* Setting: Theme -> Dropdown: Dark */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Theme
                </label>
                <div className="relative">
                  <select
                    id="select-theme"
                    value={settings.theme || 'Dark'}
                    onChange={(e) => onUpdateSettings({ theme: e.target.value })}
                    className="w-full bg-[#0c121e] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer transition-colors"
                  >
                    <option value="Dark">Dark</option>
                    <option value="Midnight Navy">Midnight Navy</option>
                    <option value="OLED Black">OLED Black</option>
                  </select>
                </div>
              </div>

              {/* Setting: Response style -> Dropdown: Professional */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Response style
                </label>
                <div className="relative">
                  <select
                    id="select-response-style"
                    value={settings.responseStyle || 'professional'}
                    onChange={(e) =>
                      onUpdateSettings({
                        responseStyle: e.target.value as UserSettings['responseStyle'],
                      })
                    }
                    className="w-full bg-[#0c121e] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer transition-colors"
                  >
                    <option value="professional">Professional</option>
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Voice' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Voice Settings
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  Speech Output
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <span className="text-xs text-zinc-300">Voice Synthesis</span>
                  <input
                    type="checkbox"
                    checked={settings.speechEnabled}
                    onChange={(e) => onUpdateSettings({ speechEnabled: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  Auto-Speak
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                  <span className="text-xs text-zinc-300">Read responses automatically</span>
                  <input
                    type="checkbox"
                    checked={settings.autoSpeakReplies}
                    onChange={(e) => onUpdateSettings({ autoSpeakReplies: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                AI Engine
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => onUpdateSettings({ model: e.target.value })}
                  className="w-full bg-[#0c121e] border border-white/[0.08] hover:border-cyan-500/30 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Recommended - Ultra-Fast & Active)</option>
                  <option value="gemini-2.5-flash">Gemini Flash (Standard)</option>
                  <option value="groq/llama-3.3-70b-versatile">Groq Llama 3.3 70B (Requires GROQ_API_KEY)</option>
                  <option value="groq/llama-3.1-8b-instant">Groq Llama 3.1 8B (Requires GROQ_API_KEY)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Temperature ({settings.temperature})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'Memory' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Context & Memory
              </h3>
              <p className="text-xs text-zinc-400">
                JARVIS retains recent contextual preferences during conversations.
              </p>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-xs text-zinc-300">
                Adaptive memory active for personalizations & preferences.
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Privacy & Security
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All voice processing and conversation data are encrypted and handled with zero data retention for training.
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                <span className="text-xs text-zinc-300">Encrypted Local Storage</span>
                <span className="text-xs text-cyan-400 font-medium">Enabled</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
