import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AudioRecord, Theme } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";
import {
  decodeAudioBlob,
  encodeWavToMp3Blob,
  extractWaveformPeaks,
  formatBytes,
  formatTime,
  sanitizeFilename,
  triggerBlobDownload,
} from "../utils/audio";

interface WaveformPlayerDockProps {
  t: (key: TranslationKey) => string;
  activeRecord: AudioRecord | null;
  theme: Theme;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  autoPlaySignal: number;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function WaveformPlayerDock({
  t,
  activeRecord,
  theme,
  playbackRate,
  onChangePlaybackRate,
  autoPlaySignal,
}: WaveformPlayerDockProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isEncodingMp3, setIsEncodingMp3] = useState(false);
  const [isDraggingWave, setIsDraggingWave] = useState(false);

  // Load new audio record into <audio> and decode waveform peaks
  useEffect(() => {
    let cancelled = false;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setIsPlaying(false);
    setCurrentTime(0);

    if (!activeRecord) {
      setDuration(0);
      setPeaks([]);
      return;
    }

    setDuration(activeRecord.durationSeconds || 0);
    const url = URL.createObjectURL(activeRecord.wavBlob);
    objectUrlRef.current = url;

    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (!cancelled && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    audio.ontimeupdate = () => {
      if (!cancelled) {
        setCurrentTime(audio.currentTime);
      }
    };
    audio.onended = () => {
      if (!cancelled && !audio.loop) {
        setIsPlaying(false);
      }
    };

    setIsDecoding(true);
    decodeAudioBlob(activeRecord.wavBlob)
      .then((buffer) => {
        if (cancelled) return;
        setDuration(buffer.duration);
        setPeaks(extractWaveformPeaks(buffer, 108));
      })
      .catch(() => {
        if (!cancelled) {
          setPeaks(new Array(72).fill(0.25));
        }
      })
      .finally(() => {
        if (!cancelled) setIsDecoding(false);
      });

    if (autoPlaySignal > 0) {
      audio
        .play()
        .then(() => {
          if (!cancelled) setIsPlaying(true);
        })
        .catch(() => {
          // Autoplay may be blocked by browser policy if not user-initiated
        });
    }

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, [activeRecord?.id, autoPlaySignal]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Sync playbackRate, loop, and volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Render canvas waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(100, Math.floor(rect.width));
    const height = Math.max(32, Math.floor(rect.height));

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const barList = peaks.length > 0 ? peaks : new Array(80).fill(0.12);
    const count = barList.length;
    const gap = 2;
    const barWidth = Math.max(1.5, (width - gap * (count - 1)) / count);
    const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

    const playedColor = theme === "dark" ? "#3B82F6" : "#2563EB";
    const unplayedColor = theme === "dark" ? "#334155" : "#CBD5E1";

    for (let i = 0; i < count; i++) {
      const amp = barList[i];
      const barH = Math.max(4, amp * (height - 6));
      const x = i * (barWidth + gap);
      const y = (height - barH) / 2;
      const barProgress = (i + 0.5) / count;
      ctx.fillStyle = barProgress <= progressRatio && activeRecord ? playedColor : unplayedColor;

      const radius = Math.min(2, barWidth / 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, radius);
      ctx.fill();
    }
  }, [peaks, currentTime, duration, theme, activeRecord]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !activeRecord) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const skipBy = (deltaSeconds: number) => {
    const audio = audioRef.current;
    if (!audio || !activeRecord) return;
    const next = Math.min(duration, Math.max(0, audio.currentTime + deltaSeconds));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const seekAtPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || !activeRecord || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleDownloadWav = () => {
    if (!activeRecord) return;
    const fname = `${sanitizeFilename(activeRecord.title)}.wav`;
    triggerBlobDownload(activeRecord.wavBlob, fname);
  };

  const handleDownloadMp3 = async () => {
    if (!activeRecord || isEncodingMp3) return;
    setIsEncodingMp3(true);
    try {
      const mp3Blob = await encodeWavToMp3Blob(activeRecord.wavBlob);
      const fname = `${sanitizeFilename(activeRecord.title)}.mp3`;
      triggerBlobDownload(mp3Blob, fname);
    } finally {
      setIsEncodingMp3(false);
    }
  };

  return (
    <section
      aria-label="Audio waveform player"
      className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 sm:px-6 py-3"
    >
      {!activeRecord ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-1">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("noAudioTitle")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("noAudioSubtitle")}</p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500">
            00:00 / 00:00
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
          {/* Track Title + Unboxed Metadata */}
          <div className="lg:w-56 shrink-0 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeRecord.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span>{activeRecord.voiceSummary}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">
                {formatBytes(activeRecord.fileSizeBytes)}
              </span>
            </p>
          </div>

          {/* Transport Controls + Interactive Waveform */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => skipBy(-5)}
                title={t("rewind5s")}
                aria-label={t("rewind5s")}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? t("pause") : t("play")}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-colors shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => skipBy(5)}
                title={t("forward5s")}
                aria-label={t("forward5s")}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0 w-10 text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 h-11 flex items-center">
                {isDecoding ? (
                  <div className="w-full text-xs text-slate-400 text-center">
                    {t("decodingWave")}
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setIsDraggingWave(true);
                      seekAtPointer(e);
                    }}
                    onPointerMove={(e) => {
                      if (isDraggingWave) seekAtPointer(e);
                    }}
                    onPointerUp={(e) => {
                      setIsDraggingWave(false);
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                    }}
                    className="w-full h-11 cursor-pointer touch-none"
                  />
                )}
              </div>

              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Speed, Volume, Loop & WAV/MP3 Export */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsLooping((prev) => !prev)}
                title={t("loop")}
                aria-label={t("loop")}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  isLooping
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-[#3B82F6] dark:bg-blue-950/40 dark:text-[#60A5FA]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>

              <select
                aria-label={t("speed")}
                value={playbackRate}
                onChange={(e) => onChangePlaybackRate(Number(e.target.value))}
                className="h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {SPEED_OPTIONS.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>

              <div className="hidden sm:flex items-center gap-1.5 px-2">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  aria-label="Volume"
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                  }}
                  aria-label="Volume slider"
                  className="w-16 accent-[#2563EB] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadWav}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t("exportWav")}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMp3}
                disabled={isEncodingMp3}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-xs font-semibold text-white dark:text-slate-900 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                {isEncodingMp3 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isEncodingMp3 ? t("encodingMp3") : t("exportMp3")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
