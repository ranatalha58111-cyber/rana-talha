import React, { useState } from 'react';
import { Globe, Disc, ExternalLink, Search, Sparkles, Video, Compass } from 'lucide-react';

export type WebIntelCategory = 'video' | 'website';

export interface WebIntelItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source?: string;
  category?: WebIntelCategory;
  authorOrChannel?: string;
}

interface WebIntelPanelProps {
  intelItems?: WebIntelItem[];
  isSearching?: boolean;
  onSearch?: (query: string) => void;
  directAnswer?: string | null;
}

export const WebIntelPanel = React.memo<WebIntelPanelProps>(({
  intelItems = [],
  isSearching = false,
  onSearch,
  directAnswer = null,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'video' | 'website'>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearch) {
      onSearch(searchInput.trim());
    }
  };

  // Strictly filter and normalize to Videos and Websites only (articles removed)
  const normalizedItems: (WebIntelItem & { category: WebIntelCategory })[] = intelItems
    .filter((item) => {
      // If explicitly categorized as article, filter out or convert if it is a valid website
      if ((item.category as string) === 'article') {
        // If it has a valid web url, convert to website, or filter out
        return Boolean(item.url && item.url !== '#');
      }
      return true;
    })
    .map((item) => {
      let cat: WebIntelCategory = item.category === 'video' ? 'video' : 'website';
      const u = (item.url || '').toLowerCase();
      const t = (item.title || '').toLowerCase();
      if (
        u.includes('youtube.com') ||
        u.includes('youtu.be') ||
        u.includes('vimeo') ||
        u.includes('dailymotion') ||
        t.includes('video') ||
        t.includes('watch')
      ) {
        cat = 'video';
      } else {
        cat = 'website';
      }
      return { ...item, category: cat };
    });

  const videoCount = normalizedItems.filter((i) => i.category === 'video').length;
  const websiteCount = normalizedItems.filter((i) => i.category === 'website').length;

  const filteredItems = normalizedItems.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.category === selectedFilter;
  });

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-[#040711]/90 border-l border-cyan-500/20 select-none">
      {/* Top Heading: ◎ WEB INTEL */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-cyan-500/15 shrink-0 bg-[#060c1c]/70">
        <div className="flex items-center gap-2 min-w-0">
          <Disc className="w-3.5 h-3.5 text-cyan-400 stroke-[2.2] shrink-0" />
          <span className="font-orbitron text-xs font-semibold text-cyan-400 tracking-[0.2em] uppercase glow-cyan-sm truncate">
            WEB INTEL
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-cyan-400/70 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
            VIDEOS & SITES
          </span>
        </div>
      </div>

      {/* Direct Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-2 border-b border-cyan-500/15 shrink-0 bg-[#050a17]/50">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search videos & sites..."
            className="w-full bg-[#070e1e] text-xs font-rajdhani text-cyan-200 placeholder-cyan-500/40 pl-7 pr-7 py-1.5 rounded-lg border border-cyan-500/25 focus:outline-none focus:border-cyan-400/60 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-cyan-400/60 absolute left-2 pointer-events-none" />
          {searchInput.trim() && (
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors cursor-pointer"
              title="Search Web"
            >
              <Globe className="w-3 h-3" />
            </button>
          )}
        </div>
      </form>

      {/* Category Filter Pills: ONLY All, Videos, and Sites */}
      <div className="px-2 py-1.5 flex items-center gap-1.5 border-b border-cyan-500/10 bg-[#040814]/80 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono-tech transition-all cursor-pointer whitespace-nowrap ${
            selectedFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/20'
          }`}
        >
          <span>All</span>
          <span className="text-[9px] opacity-70">({normalizedItems.length})</span>
        </button>

        <button
          onClick={() => setSelectedFilter('video')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono-tech transition-all cursor-pointer whitespace-nowrap ${
            selectedFilter === 'video'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20'
          }`}
        >
          <Video className="w-2.5 h-2.5" />
          <span>Videos</span>
          {videoCount > 0 && <span className="text-[9px] opacity-80">({videoCount})</span>}
        </button>

        <button
          onClick={() => setSelectedFilter('website')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono-tech transition-all cursor-pointer whitespace-nowrap ${
            selectedFilter === 'website'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
              : 'text-zinc-400 hover:text-blue-300 hover:bg-blue-950/20'
          }`}
        >
          <Compass className="w-2.5 h-2.5" />
          <span>Sites</span>
          {websiteCount > 0 && <span className="text-[9px] opacity-80">({websiteCount})</span>}
        </button>
      </div>

      {/* Content Area */}
      <div
        className={`flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0 ${
          filteredItems.length === 0 && !isSearching && !directAnswer
            ? 'flex flex-col justify-center items-center'
            : ''
        }`}
      >
        {isSearching ? (
          <div className="flex flex-col items-center justify-center text-center p-6 my-auto">
            <Globe className="w-6 h-6 text-cyan-400 animate-spin mb-3" />
            <p className="text-xs font-mono-tech text-cyan-300 tracking-wider">
              Querying Videos & Sites...
            </p>
          </div>
        ) : filteredItems.length === 0 && !directAnswer ? (
          /* Default Empty State */
          <div className="flex flex-col items-center justify-center text-center px-4 select-none my-auto">
            <Globe className="w-8 h-8 text-cyan-500/30 mb-2 stroke-[1.5]" />
            <p className="text-xs text-cyan-200/60 font-rajdhani font-medium leading-relaxed max-w-[220px]">
              Ask JARVIS anything to view real-time video suggestions and official websites here.
            </p>
          </div>
        ) : (
          /* Actual Web Intel items: Videos and Websites only */
          <>
            {directAnswer && selectedFilter === 'all' && (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 max-w-full overflow-hidden">
                <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-cyan-300 mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-bold tracking-wider">DIRECT INTEL ANSWER</span>
                </div>
                <p className="leading-relaxed font-rajdhani text-[11px] text-cyan-100/90 break-words">
                  {directAnswer}
                </p>
              </div>
            )}

            {filteredItems.map((item) => {
              const isVideo = item.category === 'video';

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`block p-2.5 rounded-xl border transition-all group cursor-pointer max-w-full overflow-hidden ${
                    isVideo
                      ? 'bg-[#12070e]/80 border-rose-500/25 hover:border-rose-400/60 hover:bg-[#190a14]'
                      : 'bg-[#050c1f]/80 border-blue-500/25 hover:border-blue-400/60 hover:bg-[#08132e]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono-tech mb-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider shrink-0 ${
                        isVideo
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {isVideo ? <Video className="w-2.5 h-2.5" /> : <Compass className="w-2.5 h-2.5" />}
                      <span>{isVideo ? 'VIDEO' : 'WEBSITE'}</span>
                    </span>

                    <span className="truncate text-zinc-400/80 text-[9px]">
                      {item.authorOrChannel || item.source || (isVideo ? 'YOUTUBE' : 'OFFICIAL SITE')}
                    </span>

                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-cyan-300 shrink-0 ml-1 transition-colors" />
                  </div>

                  <h4 className="text-xs font-semibold text-cyan-100 group-hover:text-white line-clamp-2 leading-snug break-words">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed break-words font-rajdhani">
                    {item.snippet}
                  </p>
                </a>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom Technical Status Bar */}
      <div className="h-8 px-3 flex items-center justify-between border-t border-cyan-500/15 bg-[#03060f]/95 text-[9px] font-mono-tech text-cyan-500/60 shrink-0">
        <span className="truncate">VIDEOS & SITES RADAR</span>
        <span className="text-cyan-400/90 shrink-0 ml-2 font-semibold">ACTIVE</span>
      </div>
    </div>
  );
});

WebIntelPanel.displayName = 'WebIntelPanel';
