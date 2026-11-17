import { useRef, useState } from "react";
import { ArrowRight, Loader2, Trash2, Volume2 } from "lucide-react";
import { CURATED_STYLE_PRESETS, VOICES } from "../data/voices";
import type { Language, VoiceName } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";

interface PresetsViewProps {
  t: (key: TranslationKey) => string;
  language: Language;
  customPresets: Array<{
    id: string;
    name: string;
    voiceName: VoiceName;
    stylePrompt: string;
  }>;
  onApplyPreset: (voiceName: VoiceName, stylePrompt: string) => void;
  onDeleteCustomPreset: (id: string) => void;
}

export function PresetsView({
  t,
  language,
  customPresets,
  onApplyPreset,
  onDeleteCustomPreset,
}: PresetsViewProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previewSample = async (key: string, voiceName: VoiceName, stylePrompt = "") => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingId(key);
      const res = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName, language, stylePrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.audioBase64) throw new Error("Preview failed");
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setPreviewingId(null);
      audio.onerror = () => setPreviewingId(null);
      await audio.play();
    } catch {
      setPreviewingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("presetsTitle")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t("presetsSubtitle")}</p>
      </div>

      {/* Section 1: 5 Foundation Voices */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("voicesShowcaseTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VOICES.map((voice) => {
            const isPreviewing = previewingId === `voice-${voice.id}`;
            return (
              <div
                key={voice.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {voice.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {voice.genderLabel[language]} · {voice.bestFor[language]}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">
                    {voice.toneLabel[language]}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {voice.description[language]}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => previewSample(`voice-${voice.id}`, voice.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isPreviewing ? t("previewing") : t("previewVoice")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyPreset(voice.id, "")}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>{t("usePreset")}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Curated Style Presets */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("curatedPresets")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CURATED_STYLE_PRESETS.map((preset) => {
            const isPreviewing = previewingId === `preset-${preset.id}`;
            return (
              <div
                key={preset.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {preset.name[language]}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {preset.voiceName} · {preset.category[language]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {preset.stylePrompt}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      previewSample(`preset-${preset.id}`, preset.voiceName, preset.stylePrompt)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isPreviewing ? t("previewing") : t("previewVoice")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset.voiceName, preset.stylePrompt)}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                  >
                    <span>{t("usePreset")}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Custom Saved Presets */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("customPresets")}
        </h2>
        {customPresets.length === 0 ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] p-6 text-sm text-slate-500 dark:text-slate-400">
            {t("emptyCustomPresets")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {preset.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {preset.voiceName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {preset.stylePrompt || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onDeleteCustomPreset(preset.id)}
                    aria-label={t("deletePreset")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t("deletePreset")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset.voiceName, preset.stylePrompt)}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                  >
                    <span>{t("usePreset")}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
