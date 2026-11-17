import { useRef, useState } from "react";
import { BookmarkPlus, Check, Loader2, Volume2 } from "lucide-react";
import { CURATED_STYLE_PRESETS, VOICES } from "../data/voices";
import type { DialogueSpeakerConfig, Language, StudioMode, VoiceName } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";

interface VoiceInspectorProps {
  t: (key: TranslationKey) => string;
  language: Language;
  studioMode: StudioMode;
  selectedVoice: VoiceName;
  stylePrompt: string;
  useProEngine: boolean;
  speakerA: DialogueSpeakerConfig;
  speakerB: DialogueSpeakerConfig;
  onChangeVoice: (voice: VoiceName) => void;
  onChangeStylePrompt: (style: string) => void;
  onChangeUseProEngine: (val: boolean) => void;
  onChangeSpeakerA: (cfg: DialogueSpeakerConfig) => void;
  onChangeSpeakerB: (cfg: DialogueSpeakerConfig) => void;
  onSaveCustomPreset: (name: string, voiceName: VoiceName, stylePrompt: string) => void;
}

export function VoiceInspector({
  t,
  language,
  studioMode,
  selectedVoice,
  stylePrompt,
  useProEngine,
  speakerA,
  speakerB,
  onChangeVoice,
  onChangeStylePrompt,
  onChangeUseProEngine,
  onChangeSpeakerA,
  onChangeSpeakerB,
  onSaveCustomPreset,
}: VoiceInspectorProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activeSpeakerTab, setActiveSpeakerTab] = useState<"A" | "B">("A");
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreviewVoice = async (voice: VoiceName, style?: string) => {
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingVoice(voice);
      const res = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceName: voice,
          language,
          stylePrompt: style || "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || "Preview failed");
      }
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => setPreviewingVoice(null);
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  };

  const handleSavePresetConfirm = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) return;
    onSaveCustomPreset(trimmed, selectedVoice, stylePrompt);
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  if (studioMode === "dialogue") {
    const activeCfg = activeSpeakerTab === "A" ? speakerA : speakerB;
    const updateActive = activeSpeakerTab === "A" ? onChangeSpeakerA : onChangeSpeakerB;

    return (
      <aside className="w-full xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 space-y-5 overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("inspectorTitle")}
          </h2>
        </div>

        {/* Character A / B Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveSpeakerTab("A")}
            className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors truncate ${
              activeSpeakerTab === "A"
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {speakerA.speakerName || t("speakerALabel")} ({speakerA.voiceName})
          </button>
          <button
            type="button"
            onClick={() => setActiveSpeakerTab("B")}
            className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors truncate ${
              activeSpeakerTab === "B"
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {speakerB.speakerName || t("speakerBLabel")} ({speakerB.voiceName})
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("speakerNameLabel")}
            </label>
            <input
              type="text"
              value={activeCfg.speakerName}
              onChange={(e) => updateActive({ ...activeCfg, speakerName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              {t("selectVoice")}
            </p>
            <div className="space-y-2">
              {VOICES.map((voice) => {
                const isSelected = activeCfg.voiceName === voice.id;
                const isPreviewing = previewingVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-[#2563EB] bg-blue-50/50 dark:border-[#3B82F6] dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateActive({ ...activeCfg, voiceName: voice.id })}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {voice.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {voice.genderLabel[language]} · {voice.toneLabel[language]}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePreviewVoice(voice.id, activeCfg.stylePrompt)}
                      title={t("previewVoice")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shrink-0"
                    >
                      {isPreviewing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{isPreviewing ? t("previewing") : t("previewVoice")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("customStyleLabel")}
            </label>
            <textarea
              value={activeCfg.stylePrompt}
              onChange={(e) => updateActive({ ...activeCfg, stylePrompt: e.target.value })}
              placeholder={t("customStylePlaceholder")}
              rows={3}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
            />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 space-y-5 overflow-y-auto">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t("inspectorTitle")}
        </h2>
      </div>

      {/* Speech Engine Mode */}
      <div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("engineModeLabel")}
        </p>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => onChangeUseProEngine(false)}
            className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              !useProEngine
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t("engineLite")}
          </button>
          <button
            type="button"
            onClick={() => onChangeUseProEngine(true)}
            className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              useProEngine
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t("enginePro")}
          </button>
        </div>
        {useProEngine && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
            {t("engineProHint")}
          </p>
        )}
      </div>

      {/* Voice List */}
      <div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {t("selectVoice")}
        </p>
        <div className="space-y-2">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPreviewing = previewingVoice === voice.id;
            return (
              <div
                key={voice.id}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-[#2563EB] bg-blue-50/50 dark:border-[#3B82F6] dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChangeVoice(voice.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {voice.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {voice.genderLabel[language]} · {voice.toneLabel[language]}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePreviewVoice(voice.id, stylePrompt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shrink-0"
                >
                  {isPreviewing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{isPreviewing ? t("previewing") : t("previewVoice")}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Style Presets */}
      <div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {t("stylePresetsLabel")}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {CURATED_STYLE_PRESETS.map((preset) => {
            const active =
              stylePrompt.trim() === preset.stylePrompt.trim() &&
              selectedVoice === preset.voiceName;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChangeVoice(preset.voiceName);
                  onChangeStylePrompt(preset.stylePrompt);
                }}
                className={`px-2.5 py-2 rounded-lg border text-left text-xs font-medium transition-colors truncate ${
                  active
                    ? "border-[#2563EB] bg-blue-50/50 text-[#2563EB] dark:border-[#3B82F6] dark:bg-blue-950/30 dark:text-[#60A5FA]"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
                title={preset.name[language]}
              >
                {preset.name[language]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Style Prompt + Save Preset */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t("customStyleLabel")}
        </label>
        <textarea
          value={stylePrompt}
          onChange={(e) => onChangeStylePrompt(e.target.value)}
          placeholder={t("customStylePlaceholder")}
          rows={3}
          className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
        />

        {!isSavingPreset ? (
          <button
            type="button"
            onClick={() => setIsSavingPreset(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("savePresetBtn")}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder={t("presetNamePrompt")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePresetConfirm();
              }}
              className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <button
              type="button"
              onClick={handleSavePresetConfirm}
              aria-label={t("saveBtn")}
              className="h-9 px-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSavingPreset(false);
                setNewPresetName("");
              }}
              className="h-9 px-2 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {t("cancelBtn")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
