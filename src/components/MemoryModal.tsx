import React, { useState } from 'react';
import { X, Database, Plus, Trash2, Search, Brain, Shield } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, fact: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newFact, setNewFact] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.fact.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newFact.trim()) return;
    setLoading(true);
    await onAddMemory(newKey.trim(), newFact.trim());
    setNewKey('');
    setNewFact('');
    setIsAdding(false);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0c1222] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                JARVIS Long-Term Memory Core
              </h2>
              <p className="text-xs text-slate-400">
                Persistent context and user preferences stored across sessions
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

        {/* Action Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stored memory facts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-mono transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge</span>
            </button>
          </div>
        </div>

        {/* Add Memory Inline Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 border-b border-cyan-500/20 bg-cyan-950/10 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300 font-semibold">Store New Memory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Topic / Key (e.g. Project Name)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="Fact (e.g. Current focus is Alpha release)"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                required
                className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-mono font-semibold hover:bg-cyan-400 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No matching memory facts found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-cyan-400">
                      {item.key}
                    </span>
                    {item.category === 'system' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-300">
                        <Shield className="w-2.5 h-2.5" />
                        <span>System</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {item.fact}
                  </p>
                  <span className="text-[10px] text-slate-600 font-mono mt-1 inline-block">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {item.category !== 'system' && (
                  <button
                    onClick={() => onDeleteMemory(item.id)}
                    title="Delete memory"
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Total Memories: {memories.length}</span>
          <span className="text-cyan-400/80">Active in Assistant Memory</span>
        </div>
      </div>
    </div>
  );
};
