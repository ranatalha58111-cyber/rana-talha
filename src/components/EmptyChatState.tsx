import React from 'react';
import { Globe, FileText, Sparkles, Compass } from 'lucide-react';
import { CoreVisual } from './CoreVisual';

interface EmptyChatStateProps {
  onSelectPrompt: (prompt: string) => void;
  onAttachFileClick?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  onSelectPrompt,
  onAttachFileClick,
}) => {
  const suggestions = [
    {
      id: 'search',
      title: 'Search the web',
      icon: Globe,
      prompt: 'Search the web for the latest artificial intelligence breakthroughs and summarize key points.',
    },
    {
      id: 'analyze',
      title: 'Analyze a file',
      icon: FileText,
      action: onAttachFileClick
        ? onAttachFileClick
        : () => {
            const input = document.getElementById('chat-file-input') as HTMLInputElement | null;
            if (input) {
              input.click();
            } else {
              onSelectPrompt('Can you guide me on analyzing data, documents, or code files?');
            }
          },
    },
    {
      id: 'explain',
      title: 'Explain something',
      icon: Sparkles,
      prompt: 'Explain quantum computing and its real-world applications in simple, intuitive terms.',
    },
    {
      id: 'plan',
      title: 'Help me plan',
      icon: Compass,
      prompt: 'Help me plan an efficient, structured daily workflow for focused deep work and productivity.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 sm:py-14 max-w-3xl mx-auto w-full select-none">
      {/* Top-Center Glowing Circular JARVIS Orb / Logo with slow subtle pulse */}
      <div className="mb-6 sm:mb-8 flex items-center justify-center">
        <CoreVisual size="lg" />
      </div>

      {/* Large Heading: How can I help you? */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
        How can I help you?
      </h1>

      {/* Below Heading: Ask JARVIS anything */}
      <p className="text-sm sm:text-base text-zinc-400 mt-2 sm:mt-2.5 font-normal tracking-wide">
        Ask JARVIS anything
      </p>

      {/* Under subtitle: Four rounded suggestion buttons with subtle dark-blue backgrounds and thin cyan borders */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-8 sm:mt-9 max-w-2xl">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.prompt) {
                  onSelectPrompt(item.prompt);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0c1322]/90 hover:bg-[#111c34] text-xs sm:text-sm font-medium text-zinc-200 hover:text-white border border-cyan-500/25 hover:border-cyan-400/50 shadow-[0_2px_12px_rgba(6,182,212,0.08)] hover:shadow-[0_0_18px_rgba(6,182,212,0.22)] transition-all duration-200 group cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-cyan-400/90 group-hover:text-cyan-300 transition-colors shrink-0 stroke-[2.2]" />
              <span className="tracking-wide whitespace-nowrap">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
