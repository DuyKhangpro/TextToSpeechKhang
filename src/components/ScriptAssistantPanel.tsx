import { useState } from "react";
import { Check, Loader2, Wand2, X } from "lucide-react";
import type { Language, ScriptAssistAction } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";

interface ScriptAssistantPanelProps {
  t: (key: TranslationKey) => string;
  language: Language;
  sourceText: string;
  speakerAName: string;
  speakerBName: string;
  onApplyText: (newText: string) => void;
  onApplyDialogue: (turns: Array<{ speakerRole: "A" | "B"; text: string }>) => void;
  onClose: () => void;
}

export function ScriptAssistantPanel({
  t,
  language,
  sourceText,
  speakerAName,
  speakerBName,
  onApplyText,
  onApplyDialogue,
  onClose,
}: ScriptAssistantPanelProps) {
  const [action, setAction] = useState<ScriptAssistAction>("optimize");
  const [tone, setTone] = useState("engaging podcast");
  const [targetLanguage, setTargetLanguage] = useState(language === "vi" ? "English" : "Vietnamese");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultTurns, setResultTurns] = useState<Array<{ speakerRole: "A" | "B"; text: string }> | null>(
    null
  );

  const toneOptions = [
    { value: "engaging podcast", label: language === "vi" ? "Podcast trò chuyện" : "Conversational Podcast" },
    { value: "crisp broadcast news", label: language === "vi" ? "Tin tức truyền hình" : "Broadcast News" },
    { value: "warm storytelling", label: language === "vi" ? "Kể chuyện truyền cảm" : "Warm Storytelling" },
    { value: "persuasive commercial", label: language === "vi" ? "Quảng cáo thu hút" : "Upbeat Commercial" },
    { value: "clear educational tutorial", label: language === "vi" ? "Giảng dạy dễ hiểu" : "Clear Educational" },
  ];

  const langOptions = [
    { value: "English", label: "English" },
    { value: "Vietnamese", label: "Tiếng Việt" },
    { value: "Japanese", label: language === "vi" ? "Tiếng Nhật" : "Japanese" },
    { value: "Korean", label: language === "vi" ? "Tiếng Hàn" : "Korean" },
    { value: "French", label: language === "vi" ? "Tiếng Pháp" : "French" },
    { value: "Spanish", label: language === "vi" ? "Tiếng Tây Ban Nha" : "Spanish" },
  ];

  const handleRun = async () => {
    if (!sourceText.trim()) {
      setError(t("errEmptyText"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultText(null);
    setResultTurns(null);

    try {
      const res = await fetch("/api/script/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          action,
          tone,
          targetLanguage,
          speakerAName,
          speakerBName,
          uiLanguage: language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("errGeneric"));
      }
      if (action === "to_dialogue") {
        setResultTurns(data.turns || []);
      } else {
        setResultText(data.resultText || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Wand2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
          <span>{t("assistTitle")}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("assistClose")}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80">
        {(
          [
            { id: "optimize", label: t("assistOptimize") },
            { id: "rewrite", label: t("assistRewrite") },
            { id: "translate", label: t("assistTranslate") },
            { id: "to_dialogue", label: t("assistToDialogue") },
          ] as Array<{ id: ScriptAssistAction; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAction(tab.id);
              setResultText(null);
              setResultTurns(null);
              setError(null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              action === tab.id
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-options */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {action === "rewrite" && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("assistToneLabel")}
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {toneOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {action === "translate" && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("assistTargetLangLabel")}
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {langOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleRun}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
          <span>{isLoading ? t("assistRunning") : t("assistRun")}</span>
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Preview Text Result */}
      {resultText !== null && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("assistPreviewLabel")}
          </p>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {resultText}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyText(resultText)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("assistApply")}</span>
            </button>
            <button
              type="button"
              onClick={() => setResultText(null)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {t("assistDiscard")}
            </button>
          </div>
        </div>
      )}

      {/* Preview Dialogue Result */}
      {resultTurns !== null && resultTurns.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("assistPreviewLabel")}
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {resultTurns.map((turn, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-xs space-y-1"
              >
                <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  {turn.speakerRole === "A" ? speakerAName : speakerBName}
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{turn.text}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyDialogue(resultTurns)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("assistApplyDialogue")}</span>
            </button>
            <button
              type="button"
              onClick={() => setResultTurns(null)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {t("assistDiscard")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
