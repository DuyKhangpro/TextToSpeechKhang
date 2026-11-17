import { useRef, useState } from "react";
import { Eraser, Wand2 } from "lucide-react";
import { EXPRESSION_TAGS } from "../data/voices";
import type { Language } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";
import { ScriptAssistantPanel } from "./ScriptAssistantPanel";

interface SingleSpeakerEditorProps {
  t: (key: TranslationKey) => string;
  language: Language;
  title: string;
  text: string;
  speakerAName: string;
  speakerBName: string;
  onChangeTitle: (val: string) => void;
  onChangeText: (val: string) => void;
  onApplyDialogueFromAssist: (turns: Array<{ speakerRole: "A" | "B"; text: string }>) => void;
}

export function SingleSpeakerEditor({
  t,
  language,
  title,
  text,
  speakerAName,
  speakerBName,
  onChangeTitle,
  onChangeText,
  onApplyDialogueFromAssist,
}: SingleSpeakerEditorProps) {
  const [showAssist, setShowAssist] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estSeconds = Math.max(1, Math.round(wordCount / 2.4));

  const insertTagAtCursor = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChangeText(text ? `${text} ${tag}` : tag);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const padLeft = before && !before.endsWith(" ") && !before.endsWith("\n") ? " " : "";
    const padRight = after && !after.startsWith(" ") && !after.startsWith("\n") ? " " : "";
    const next = `${before}${padLeft}${tag}${padRight}${after}`;
    onChangeText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + padLeft.length + tag.length + padRight.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("singleHeader")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t("singleSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAssist((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              showAssist
                ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] dark:border-[#60A5FA] dark:text-[#60A5FA]"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("aiAssistBtn")}</span>
          </button>

          {text.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeText("")}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("clearText")}</span>
            </button>
          )}
        </div>
      </div>

      {showAssist && (
        <ScriptAssistantPanel
          t={t}
          language={language}
          sourceText={text}
          speakerAName={speakerAName}
          speakerBName={speakerBName}
          onApplyText={(next) => {
            onChangeText(next);
            setShowAssist(false);
          }}
          onApplyDialogue={(turns) => {
            onApplyDialogueFromAssist(turns);
            setShowAssist(false);
          }}
          onClose={() => setShowAssist(false)}
        />
      )}

      {/* Main Editor Surface */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={t("scriptPlaceholder")}
          rows={11}
          className="w-full p-4 bg-transparent text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-y min-h-[240px]"
        />

        {/* Expression tags & live metrics footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
              {t("expressionHintSingle")}:
            </span>
            {EXPRESSION_TAGS.map((item) => (
              <button
                key={item.tag}
                type="button"
                title={item.hint[language]}
                onClick={() => insertTagAtCursor(item.tag)}
                className="px-2 py-1 rounded-md text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:border-[#60A5FA] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap"
              >
                {item.label[language]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <span>
              {charCount} {t("characters")}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {wordCount} {t("words")}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t("estDuration")} ~{wordCount > 0 ? `${estSeconds}s` : "0s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
