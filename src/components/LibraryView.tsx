import { useMemo, useState } from "react";
import { Download, FileAudio, Loader2, Play, Search, Trash2 } from "lucide-react";
import type { AudioRecord, Language } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";
import {
  encodeWavToMp3Blob,
  formatBytes,
  formatTime,
  sanitizeFilename,
  triggerBlobDownload,
} from "../utils/audio";

interface LibraryViewProps {
  t: (key: TranslationKey) => string;
  language: Language;
  records: AudioRecord[];
  activeRecordId: string | null;
  onPlayRecord: (record: AudioRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onGoToStudio: () => void;
}

export function LibraryView({
  t,
  language,
  records,
  activeRecordId,
  onPlayRecord,
  onDeleteRecord,
  onClearAll,
  onGoToStudio,
}: LibraryViewProps) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "single" | "dialogue">("all");
  const [encodingId, setEncodingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((rec) => {
      if (filterMode !== "all" && rec.mode !== filterMode) return false;
      if (!q) return true;
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.textPreview.toLowerCase().includes(q) ||
        rec.voiceSummary.toLowerCase().includes(q)
      );
    });
  }, [records, query, filterMode]);

  const handleDownloadMp3 = async (rec: AudioRecord) => {
    if (encodingId) return;
    setEncodingId(rec.id);
    try {
      const mp3Blob = await encodeWavToMp3Blob(rec.wavBlob);
      triggerBlobDownload(mp3Blob, `${sanitizeFilename(rec.title)}.mp3`);
    } finally {
      setEncodingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("libraryTitle")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t("librarySubtitle")}
          </p>
        </div>

        {records.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {records.length} {t("recordsCount")}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("clearLibrary")}</span>
            </button>
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <FileAudio className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("emptyLibraryTitle")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("emptyLibraryDesc")}</p>
          </div>
          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
          >
            <span>{t("goToStudio")}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Search & Segmented Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 self-start">
              {(
                [
                  { id: "all", label: t("filterAll") },
                  { id: "single", label: t("filterSingle") },
                  { id: "dialogue", label: t("filterDialogue") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    filterMode === tab.id
                      ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recordings List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {filtered.map((rec) => {
              const isCurrent = rec.id === activeRecordId;
              const modeLabel = rec.mode === "dialogue" ? t("filterDialogue") : t("filterSingle");
              const dateText = new Date(rec.createdAt).toLocaleString(
                language === "vi" ? "vi-VN" : "en-US",
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={rec.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isCurrent
                      ? "bg-blue-50/40 dark:bg-blue-950/20"
                      : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onPlayRecord(rec)}
                      aria-label={t("playRecord")}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isCurrent
                          ? "bg-[#2563EB] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#2563EB] hover:text-white"
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {rec.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                        {rec.textPreview}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{modeLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.voiceSummary}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatTime(rec.durationSeconds)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatBytes(rec.fileSizeBytes)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{dateText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() =>
                        triggerBlobDownload(rec.wavBlob, `${sanitizeFilename(rec.title)}.wav`)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>WAV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadMp3(rec)}
                      disabled={encodingId === rec.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      {encodingId === rec.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>MP3</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      aria-label={t("deleteRecord")}
                      title={t("deleteRecord")}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
