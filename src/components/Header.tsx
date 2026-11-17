import { Loader2, Play } from "lucide-react";
import type { NavSection } from "../types/tts";

interface HeaderProps {
  brandName: string;
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  navLabels: {
    studio: string;
    library: string;
    presets: string;
  };
  generateLabel: string;
  generatingLabel: string;
  isGenerating: boolean;
  onGenerate: () => void;
  showGenerateAction: boolean;
}

export function Header({
  brandName,
  activeNav,
  onSelectNav,
  navLabels,
  generateLabel,
  generatingLabel,
  isGenerating,
  onGenerate,
  showGenerateAction,
}: HeaderProps) {
  const navItems: Array<{ id: NavSection; label: string }> = [
    { id: "studio", label: navLabels.studio },
    { id: "library", label: navLabels.library },
    { id: "presets", label: navLabels.presets },
  ];

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 sm:px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Single-line Brand Wordmark */}
      <button
        type="button"
        onClick={() => onSelectNav("studio")}
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md"
      >
        {brandName}
      </button>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-sm ${
                isActive
                  ? "text-[#2563EB] dark:text-[#60A5FA]"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-[#2563EB] dark:bg-[#60A5FA]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        {showGenerateAction ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-offset-[#111827]"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            )}
            <span>{isGenerating ? generatingLabel : generateLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectNav("studio")}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
          >
            <span>{navLabels.studio}</span>
          </button>
        )}
      </div>
    </header>
  );
}
