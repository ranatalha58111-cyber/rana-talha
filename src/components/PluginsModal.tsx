import React, { useState } from 'react';
import {
  X,
  Puzzle,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Globe,
  CloudSun,
  Clock,
  Brain,
  Terminal,
  Calculator,
  Calendar,
  FileText,
  Music,
  Mail,
  Code2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { JarvisToolItem, CustomPluginPayload } from '../types';

interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: JarvisToolItem[];
  onToggleTool: (toolId: string, enabled: boolean) => Promise<void>;
  onAddPlugin: (plugin: CustomPluginPayload) => Promise<void>;
  onRemovePlugin: (pluginId: string) => Promise<void>;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({
  isOpen,
  onClose,
  tools,
  onToggleTool,
  onAddPlugin,
  onRemovePlugin,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPlugin, setIsAddingPlugin] = useState(false);
  const [expandedSchemaId, setExpandedSchemaId] = useState<string | null>(null);

  // Form state for creating custom plugin
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDisplayName, setNewPluginDisplayName] = useState('');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginParamName, setNewPluginParamName] = useState('query');
  const [newPluginParamDesc, setNewPluginParamDesc] = useState('Input query for this capability');
  const [newPluginTemplate, setNewPluginTemplate] = useState('Executed plugin successfully with: {{input}}');
  const [newPluginVersion, setNewPluginVersion] = useState('1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'system', label: 'System' },
    { id: 'information', label: 'Information' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'utilities', label: 'Utilities' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'plugins', label: 'Custom Plugins' },
  ];

  const getToolIcon = (name: string, category: string) => {
    switch (name) {
      case 'searchWeb':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'getWeather':
        return <CloudSun className="w-4 h-4 text-amber-400" />;
      case 'getCurrentTime':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'saveMemory':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'systemAutomation':
        return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'evaluateMath':
        return <Calculator className="w-4 h-4 text-indigo-400" />;
      case 'manageCalendar':
        return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'manageNotes':
        return <FileText className="w-4 h-4 text-teal-400" />;
      case 'spotifyController':
        return <Music className="w-4 h-4 text-emerald-500" />;
      case 'emailDispatcher':
        return <Mail className="w-4 h-4 text-orange-400" />;
      default:
        return <Puzzle className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesCat = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch =
      tool.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeCount = tools.filter((t) => t.enabled).length;

  const handleCreatePlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName.trim() || !newPluginDesc.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddPlugin({
        name: newPluginName.trim(),
        displayName: newPluginDisplayName.trim() || newPluginName.trim(),
        description: newPluginDesc.trim(),
        version: newPluginVersion.trim() || '1.0.0',
        category: 'plugins',
        parameterName: newPluginParamName.trim() || 'input',
        parameterDescription: newPluginParamDesc.trim() || 'Input data',
        mockResponseTemplate: newPluginTemplate.trim() || 'Output: {{input}}',
      });

      // Reset form
      setNewPluginName('');
      setNewPluginDisplayName('');
      setNewPluginDesc('');
      setNewPluginTemplate('Executed plugin successfully with: {{input}}');
      setIsAddingPlugin(false);
    } catch (err) {
      console.error('Failed to create plugin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0c1222] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  Modular Tools & Plugins
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {activeCount} / {tools.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extensible capability registry. Enable, configure, or register new plugins without restarting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Search & Category tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/60 bg-slate-900/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities, tools, or triggers..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>
            <button
              onClick={() => setIsAddingPlugin(!isAddingPlugin)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingPlugin ? 'Close Form' : 'New Plugin'}</span>
            </button>
          </div>

          {/* Categories Pill Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Plugin Creator Drawer */}
        {isAddingPlugin && (
          <form
            onSubmit={handleCreatePlugin}
            className="p-5 border-b border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/40 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wide">
                  Register New Plugin / Tool
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Zero Core Rebuild Required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Function Identifier (no spaces)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. checkCryptoRates"
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crypto Market Ticker"
                  value={newPluginDisplayName}
                  onChange={(e) => setNewPluginDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Natural Language Description (Used by JARVIS to select this tool)
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Retrieve current pricing, 24h market volume, and indicators for BTC, ETH, and other digital assets."
                value={newPluginDesc}
                onChange={(e) => setNewPluginDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Parameter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. symbol"
                  value={newPluginParamName}
                  onChange={(e) => setNewPluginParamName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Mock / Output Template
                </label>
                <input
                  type="text"
                  placeholder="e.g. Live telemetry for {{input}}: Price $68,450 (+4.2%)"
                  value={newPluginTemplate}
                  onChange={(e) => setNewPluginTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingPlugin(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
              >
                {isSubmitting ? 'Registering...' : 'Install Plugin'}
              </button>
            </div>
          </form>
        )}

        {/* Tools & Modules List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredTools.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-mono text-xs">
              No matching modules found in registry.
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isSchemaOpen = expandedSchemaId === tool.id;
              return (
                <div
                  key={tool.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    tool.enabled
                      ? 'bg-slate-900/50 border-slate-800/90'
                      : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5">
                        {getToolIcon(tool.name, tool.category)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100 font-mono">
                            {tool.displayName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            v{tool.version}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
                            {tool.category}
                          </span>
                          {tool.isPlugin && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              Custom Plugin
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                          {tool.description}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                          <span>fn: <code className="text-cyan-300/90">{tool.name}()</code></span>
                          <span>•</span>
                          <span>Source: {tool.author}</span>
                          <span>•</span>
                          <button
                            onClick={() => setExpandedSchemaId(isSchemaOpen ? null : tool.id)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <Code2 className="w-3 h-3" />
                            <span>Schema</span>
                            {isSchemaOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {tool.isPlugin && (
                        <button
                          onClick={() => onRemovePlugin(tool.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Uninstall plugin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Toggle Switch */}
                      <button
                        onClick={() => onToggleTool(tool.id, !tool.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tool.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                        title={tool.enabled ? 'Disable capability' : 'Enable capability'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tool.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Parameter Schema view for developers */}
                  {isSchemaOpen && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1 overflow-x-auto">
                      <div className="text-cyan-400 font-semibold mb-1">Parameters Schema:</div>
                      <pre className="whitespace-pre-wrap text-slate-300">
                        {JSON.stringify(tool.parameterSchema || { type: 'OBJECT', properties: {} }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Changes reflect instantly in conversation context</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
