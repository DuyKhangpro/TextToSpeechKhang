import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Mic, Moon, Sun, Users, X } from "lucide-react";
import { SAMPLE_SCRIPTS } from "./data/voices";
import { TRANSLATIONS, type TranslationKey } from "./i18n/translations";
import type {
  AppPreferences,
  AudioRecord,
  DialogueSpeakerConfig,
  DialogueTurn,
  Language,
  NavSection,
  StudioMode,
  Theme,
  VoiceName,
} from "./types/tts";
import { base64ToWavBlob, decodeAudioBlob } from "./utils/audio";
import {
  clearAllRecordingsFromDb,
  deleteRecordingFromDb,
  getAllRecordingsFromDb,
  loadPreferences,
  savePreferences,
  saveRecordingToDb,
} from "./utils/storage";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { SingleSpeakerEditor } from "./components/SingleSpeakerEditor";
import { DialogueEditor } from "./components/DialogueEditor";
import { VoiceInspector } from "./components/VoiceInspector";
import { WaveformPlayerDock } from "./components/WaveformPlayerDock";
import { LibraryView } from "./components/LibraryView";
import { PresetsView } from "./components/PresetsView";

export default function App() {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPreferences());
  const [activeNav, setActiveNav] = useState<NavSection>("studio");
  const [studioMode, setStudioMode] = useState<StudioMode>("single");

  // Single-speaker state
  const [singleTitle, setSingleTitle] = useState<string>(SAMPLE_SCRIPTS.singleNews.vi.title);
  const [singleText, setSingleText] = useState<string>(SAMPLE_SCRIPTS.singleNews.vi.text);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(
    SAMPLE_SCRIPTS.singleNews.vi.voiceName
  );
  const [stylePrompt, setStylePrompt] = useState<string>(
    SAMPLE_SCRIPTS.singleNews.vi.stylePrompt
  );
  const [useProEngine, setUseProEngine] = useState<boolean>(false);

  // Dialogue state
  const [dialogueTitle, setDialogueTitle] = useState<string>(
    SAMPLE_SCRIPTS.dialoguePodcast.vi.title
  );
  const [speakerA, setSpeakerA] = useState<DialogueSpeakerConfig>(
    SAMPLE_SCRIPTS.dialoguePodcast.vi.speakerA
  );
  const [speakerB, setSpeakerB] = useState<DialogueSpeakerConfig>(
    SAMPLE_SCRIPTS.dialoguePodcast.vi.speakerB
  );
  const [turns, setTurns] = useState<DialogueTurn[]>(() =>
    SAMPLE_SCRIPTS.dialoguePodcast.vi.turns.map((item, idx) => ({
      id: `init-${idx}`,
      speakerRole: item.speakerRole,
      text: item.text,
    }))
  );

  // Library & Playback state
  const [records, setRecords] = useState<AudioRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<AudioRecord | null>(null);
  const [autoPlaySignal, setAutoPlaySignal] = useState<number>(0);

  // Synthesis status & toast/error banner
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const t = useCallback(
    (key: TranslationKey): string => TRANSLATIONS[prefs.language][key],
    [prefs.language]
  );

  // Sync dark class & HTML lang attribute
  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
    document.documentElement.lang = prefs.language;
    savePreferences(prefs);
  }, [prefs]);

  // Load saved IndexedDB audio recordings on startup
  useEffect(() => {
    getAllRecordingsFromDb()
      .then((list) => {
        setRecords(list);
        if (list.length > 0) {
          setActiveRecord(list[0]);
        }
      })
      .catch(() => {
        // Ignore IndexedDB unavailability in restricted environments
      });
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleChangeTheme = (theme: Theme) => {
    setPrefs((prev) => ({ ...prev, theme }));
  };

  const handleChangeLanguage = (language: Language) => {
    setPrefs((prev) => ({ ...prev, language }));
  };

  const handleChangePlaybackRate = (playbackRate: number) => {
    setPrefs((prev) => ({ ...prev, playbackRate }));
  };

  const handleSaveCustomPreset = (name: string, voiceName: VoiceName, style: string) => {
    const newPreset = {
      id: `custom-${Date.now()}`,
      name,
      voiceName,
      stylePrompt: style,
    };
    setPrefs((prev) => ({
      ...prev,
      customPresets: [newPreset, ...prev.customPresets],
    }));
    showToast(t("savedPresetToast"));
  };

  const handleDeleteCustomPreset = (id: string) => {
    setPrefs((prev) => ({
      ...prev,
      customPresets: prev.customPresets.filter((item) => item.id !== id),
    }));
  };

  const handleLoadSample = (
    sampleKey: "singleNews" | "singleStory" | "dialoguePodcast" | "dialogueCafe"
  ) => {
    const lang = prefs.language;
    setActiveNav("studio");
    setErrorBanner(null);

    if (sampleKey === "singleNews" || sampleKey === "singleStory") {
      const sample = SAMPLE_SCRIPTS[sampleKey][lang];
      setStudioMode("single");
      setSingleTitle(sample.title);
      setSingleText(sample.text);
      setSelectedVoice(sample.voiceName);
      setStylePrompt(sample.stylePrompt);
      if (sample.text.includes("<breath>") || sample.text.includes("<laugh>")) {
        setUseProEngine(true);
      }
    } else {
      const sample = SAMPLE_SCRIPTS[sampleKey][lang];
      setStudioMode("dialogue");
      setDialogueTitle(sample.title);
      setSpeakerA({ ...sample.speakerA });
      setSpeakerB({ ...sample.speakerB });
      setTurns(
        sample.turns.map((item, idx) => ({
          id: `sample-${Date.now()}-${idx}`,
          speakerRole: item.speakerRole,
          text: item.text,
        }))
      );
    }
  };

  const handleGenerate = async () => {
    setErrorBanner(null);

    if (studioMode === "single") {
      const cleanText = singleText.trim();
      if (!cleanText) {
        setErrorBanner(t("errEmptyText"));
        return;
      }

      setIsGenerating(true);
      try {
        const res = await fetch("/api/tts/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            voiceName: selectedVoice,
            stylePrompt,
            useProEngine,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || t("errGeneric"));
        }

        const wavBlob = base64ToWavBlob(data.audioBase64, data.mimeType || "audio/wav");
        let durationSeconds = 0;
        try {
          const buffer = await decodeAudioBlob(wavBlob);
          durationSeconds = buffer.duration;
        } catch {
          durationSeconds = Math.max(1, Math.round(cleanText.split(/\s+/).length / 2.4));
        }

        const record: AudioRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title:
            singleTitle.trim() ||
            cleanText.slice(0, 42) + (cleanText.length > 42 ? "..." : ""),
          mode: "single",
          textPreview: cleanText.slice(0, 140),
          voiceSummary: selectedVoice,
          styleSummary: stylePrompt.trim(),
          model: data.model || "gemini-3.8-flash-lite-tts",
          createdAt: Date.now(),
          durationSeconds,
          fileSizeBytes: wavBlob.size,
          wavBlob,
        };

        await saveRecordingToDb(record).catch(() => {});
        setRecords((prev) => [record, ...prev]);
        setActiveRecord(record);
        setAutoPlaySignal((n) => n + 1);
        showToast(t("audioReadyToast"));
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : t("errGeneric"));
      } finally {
        setIsGenerating(false);
      }
    } else {
      const validTurns = turns.filter((item) => item.text.trim().length > 0);
      if (validTurns.length === 0) {
        setErrorBanner(t("errEmptyDialogue"));
        return;
      }

      setIsGenerating(true);
      try {
        const res = await fetch("/api/tts/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turns: validTurns.map((item) => ({
              speakerRole: item.speakerRole,
              text: item.text.trim(),
            })),
            speakerA,
            speakerB,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || t("errGeneric"));
        }

        const wavBlob = base64ToWavBlob(data.audioBase64, data.mimeType || "audio/wav");
        const combinedText = validTurns.map((item) => item.text.trim()).join(" ");
        let durationSeconds = 0;
        try {
          const buffer = await decodeAudioBlob(wavBlob);
          durationSeconds = buffer.duration;
        } catch {
          durationSeconds = Math.max(2, Math.round(combinedText.split(/\s+/).length / 2.4));
        }

        const record: AudioRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title:
            dialogueTitle.trim() ||
            `${speakerA.speakerName} & ${speakerB.speakerName}`,
          mode: "dialogue",
          textPreview: validTurns
            .map(
              (item) =>
                `${item.speakerRole === "A" ? speakerA.speakerName : speakerB.speakerName}: ${item.text.trim()}`
            )
            .join(" / ")
            .slice(0, 140),
          voiceSummary: `${speakerA.voiceName} & ${speakerB.voiceName}`,
          styleSummary: "Dual-speaker dialogue",
          model: data.model || "gemini-3.8-flash-tts",
          createdAt: Date.now(),
          durationSeconds,
          fileSizeBytes: wavBlob.size,
          wavBlob,
        };

        await saveRecordingToDb(record).catch(() => {});
        setRecords((prev) => [record, ...prev]);
        setActiveRecord(record);
        setAutoPlaySignal((n) => n + 1);
        showToast(t("audioReadyToast"));
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : t("errGeneric"));
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteRecordingFromDb(id).catch(() => {});
    setRecords((prev) => prev.filter((item) => item.id !== id));
    if (activeRecord?.id === id) {
      setActiveRecord(null);
    }
  };

  const handleClearLibrary = async () => {
    await clearAllRecordingsFromDb().catch(() => {});
    setRecords([]);
    setActiveRecord(null);
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B0F17] dark:text-[#F1F5F9]">
      <Header
        brandName={t("brandName")}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        navLabels={{
          studio: t("navStudio"),
          library: t("navLibrary"),
          presets: t("navPresets"),
        }}
        generateLabel={t("generateBtn")}
        generatingLabel={t("generatingBtn")}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        showGenerateAction={activeNav === "studio"}
      />

      {/* Compact Mobile & Tablet Workspace Strip (hidden on lg where Sidebar is visible) */}
      <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveNav("studio");
              setStudioMode("single");
            }}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeNav === "studio" && studioMode === "single"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {t("modeSingle")}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveNav("studio");
              setStudioMode("dialogue");
            }}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeNav === "studio" && studioMode === "dialogue"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {t("modeDialogue")}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav("library")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeNav === "library"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {t("navLibrary")}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav("presets")}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeNav === "presets"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {t("navPresets")}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleChangeTheme(prefs.theme === "light" ? "dark" : "light")}
            aria-label={t("themeLabel")}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            {prefs.theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => handleChangeLanguage(prefs.language === "vi" ? "en" : "vi")}
            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {prefs.language === "vi" ? "EN" : "VI"}
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          t={t}
          activeNav={activeNav}
          studioMode={studioMode}
          recordsCount={records.length}
          theme={prefs.theme}
          language={prefs.language}
          onSelectStudioMode={setStudioMode}
          onSelectNav={setActiveNav}
          onChangeTheme={handleChangeTheme}
          onChangeLanguage={handleChangeLanguage}
          onLoadSample={handleLoadSample}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Error & Success Feedback Banners */}
          {(errorBanner || successToast) && (
            <div className="px-4 sm:px-6 pt-4 space-y-2">
              {errorBanner && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{errorBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorBanner(null)}
                    aria-label="Close error"
                    className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {successToast && (
                <div
                  role="status"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{successToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessToast(null)}
                    aria-label="Close notice"
                    className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeNav === "studio" && (
            <div className="flex-1 flex flex-col xl:flex-row min-h-0">
              {/* Central Editor Canvas */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Inline Mode Switcher above Editor */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setStudioMode("single")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        studioMode === "single"
                          ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t("modeSingle")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioMode("dialogue")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        studioMode === "dialogue"
                          ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t("modeDialogue")}</span>
                    </button>
                  </div>
                </div>

                {studioMode === "single" ? (
                  <SingleSpeakerEditor
                    t={t}
                    language={prefs.language}
                    title={singleTitle}
                    text={singleText}
                    speakerAName={speakerA.speakerName}
                    speakerBName={speakerB.speakerName}
                    onChangeTitle={setSingleTitle}
                    onChangeText={setSingleText}
                    onApplyDialogueFromAssist={(newTurns) => {
                      setStudioMode("dialogue");
                      setDialogueTitle(singleTitle || "AI Dialogue");
                      setTurns(
                        newTurns.map((item, idx) => ({
                          id: `assist-${Date.now()}-${idx}`,
                          speakerRole: item.speakerRole,
                          text: item.text,
                        }))
                      );
                    }}
                  />
                ) : (
                  <DialogueEditor
                    t={t}
                    language={prefs.language}
                    title={dialogueTitle}
                    speakerA={speakerA}
                    speakerB={speakerB}
                    turns={turns}
                    onChangeTitle={setDialogueTitle}
                    onChangeTurns={setTurns}
                  />
                )}
              </div>

              {/* Right Voice Inspector */}
              <VoiceInspector
                t={t}
                language={prefs.language}
                studioMode={studioMode}
                selectedVoice={selectedVoice}
                stylePrompt={stylePrompt}
                useProEngine={useProEngine}
                speakerA={speakerA}
                speakerB={speakerB}
                onChangeVoice={setSelectedVoice}
                onChangeStylePrompt={setStylePrompt}
                onChangeUseProEngine={setUseProEngine}
                onChangeSpeakerA={setSpeakerA}
                onChangeSpeakerB={setSpeakerB}
                onSaveCustomPreset={handleSaveCustomPreset}
              />
            </div>
          )}

          {activeNav === "library" && (
            <LibraryView
              t={t}
              language={prefs.language}
              records={records}
              activeRecordId={activeRecord?.id ?? null}
              onPlayRecord={(rec) => {
                setActiveRecord(rec);
                setAutoPlaySignal((n) => n + 1);
              }}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearLibrary}
              onGoToStudio={() => setActiveNav("studio")}
            />
          )}

          {activeNav === "presets" && (
            <PresetsView
              t={t}
              language={prefs.language}
              customPresets={prefs.customPresets}
              onApplyPreset={(voiceName, style) => {
                setSelectedVoice(voiceName);
                setStylePrompt(style);
                setStudioMode("single");
                setActiveNav("studio");
              }}
              onDeleteCustomPreset={handleDeleteCustomPreset}
            />
          )}
        </main>
      </div>

      {/* Bottom Interactive Waveform Player & Export Dock */}
      <WaveformPlayerDock
        t={t}
        activeRecord={activeRecord}
        theme={prefs.theme}
        playbackRate={prefs.playbackRate}
        onChangePlaybackRate={handleChangePlaybackRate}
        autoPlaySignal={autoPlaySignal}
      />
    </div>
  );
}
