import { BookOpen, FileAudio, FileText, Mic, Moon, Sliders, Sun, Users } from "lucide-react";
import type { Language, NavSection, StudioMode, Theme } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";

interface SidebarProps {
  t: (key: TranslationKey) => string;
  activeNav: NavSection;
  studioMode: StudioMode;
  recordsCount: number;
  theme: Theme;
  language: Language;
  onSelectStudioMode: (mode: StudioMode) => void;
  onSelectNav: (nav: NavSection) => void;
  onChangeTheme: (theme: Theme) => void;
  onChangeLanguage: (lang: Language) => void;
  onLoadSample: (sampleKey: "singleNews" | "singleStory" | "dialoguePodcast" | "dialogueCafe") => void;
}

export function Sidebar({
  t,
  activeNav,
  studioMode,
  recordsCount,
  theme,
  language,
  onSelectStudioMode,
  onSelectNav,
  onChangeTheme,
  onChangeLanguage,
  onLoadSample,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Workspace Section */}
        <div>
          <p className="px-2.5 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("workspaceSection")}
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectNav("studio");
                onSelectStudioMode("single");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeNav === "studio" && studioMode === "single"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("modeSingle")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectNav("studio");
                onSelectStudioMode("dialogue");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeNav === "studio" && studioMode === "dialogue"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("modeDialogue")}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectNav("library")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeNav === "library"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FileAudio className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t("libraryNav")}</span>
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {recordsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectNav("presets")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeNav === "presets"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("presetsNav")}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
          <p className="px-2.5 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("samplesSection")}
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onLoadSample("singleNews")}
              className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("sampleSingleNews")}</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadSample("singleStory")}
              className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 transition-colors text-left"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("sampleSingleStory")}</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadSample("dialoguePodcast")}
              className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 transition-colors text-left"
            >
              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("sampleDialoguePodcast")}</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadSample("dialogueCafe")}
              className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[38px] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 transition-colors text-left"
            >
              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("sampleDialogueCafe")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Preferences: Theme & Language Switchers */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("themeLabel")}
          </p>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => onChangeTheme("light")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("themeLight")}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme("dark")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                theme === "dark"
                  ? "bg-slate-900 text-slate-100 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("themeDark")}</span>
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("langLabel")}
          </p>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => onChangeLanguage("vi")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                language === "vi"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage("en")}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                language === "en"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
