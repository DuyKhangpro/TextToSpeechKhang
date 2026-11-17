import { Mp3Encoder } from "@breezystack/lamejs";

export function base64ToWavBlob(base64: string, mimeType = "audio/wav"): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = getAudioContext();
  return await ctx.decodeAudioData(arrayBuffer.slice(0));
}

export function extractWaveformPeaks(buffer: AudioBuffer, barsCount = 96): number[] {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  if (totalSamples === 0) {
    return new Array(barsCount).fill(0.08);
  }

  const blockSize = Math.max(1, Math.floor(totalSamples / barsCount));
  const peaks: number[] = [];
  let maxPeak = 0.001;

  for (let i = 0; i < barsCount; i++) {
    const start = i * blockSize;
    const end = Math.min(totalSamples, start + blockSize);
    let sumSq = 0;
    let peak = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > peak) peak = val;
      sumSq += val * val;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    const combined = peak * 0.55 + rms * 0.45;
    peaks.push(combined);
    if (combined > maxPeak) maxPeak = combined;
  }

  return peaks.map((p) => Math.max(0.06, Math.min(1, p / maxPeak)));
}

function parseWavPcm(arrayBuffer: ArrayBuffer): {
  sampleRate: number;
  numChannels: number;
  samples: Int16Array;
} | null {
  if (arrayBuffer.byteLength < 44) return null;
  const view = new DataView(arrayBuffer);

  // Verify RIFF/WAVE header
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== "RIFF" || wave !== "WAVE") return null;

  let offset = 12;
  let numChannels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;

  while (offset + 8 <= arrayBuffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === "data") {
      if (bitsPerSample !== 16) return null;
      const dataStart = offset + 8;
      const byteLength = Math.min(chunkSize, arrayBuffer.byteLength - dataStart);
      const sampleCount = Math.floor(byteLength / 2);
      const samples = new Int16Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        samples[i] = view.getInt16(dataStart + i * 2, true);
      }
      return { sampleRate, numChannels, samples };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}

export async function encodeWavToMp3Blob(wavBlob: Blob): Promise<Blob> {
  const arrayBuffer = await wavBlob.arrayBuffer();
  const parsed = parseWavPcm(arrayBuffer);

  let sampleRate = 24000;
  let monoSamples: Int16Array;

  if (parsed && parsed.numChannels === 1) {
    sampleRate = parsed.sampleRate;
    monoSamples = parsed.samples;
  } else {
    const buffer = await decodeAudioBlob(wavBlob);
    sampleRate = buffer.sampleRate;
    const floatData = buffer.getChannelData(0);
    monoSamples = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const clamped = Math.max(-1, Math.min(1, floatData[i]));
      monoSamples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
  }

  const encoder = new Mp3Encoder(1, sampleRate, 128);
  const blockSize = 1152;
  const mp3Parts: Uint8Array[] = [];

  for (let i = 0; i < monoSamples.length; i += blockSize) {
    const slice = monoSamples.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(slice);
    if (encoded.length > 0) {
      mp3Parts.push(new Uint8Array(encoded));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Parts.push(new Uint8Array(flushed));
  }

  const totalLength = mp3Parts.reduce((acc, part) => acc + part.length, 0);
  const merged = new Uint8Array(totalLength);
  let cursor = 0;
  for (const part of mp3Parts) {
    merged.set(part, cursor);
    cursor += part.length;
  }

  return new Blob([merged.buffer], { type: "audio/mpeg" });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sanitizeFilename(name: string): string {
  const clean = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return clean || "thanham-audio";
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
