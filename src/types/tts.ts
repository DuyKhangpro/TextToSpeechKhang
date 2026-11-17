export type Language = "vi" | "en";
export type Theme = "light" | "dark";
export type VoiceName = "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";
export type StudioMode = "single" | "dialogue";
export type NavSection = "studio" | "library" | "presets";
export type ScriptAssistAction = "optimize" | "rewrite" | "translate" | "to_dialogue";

export interface VoiceMetadata {
  id: VoiceName;
  name: string;
  genderLabel: Record<Language, string>;
  toneLabel: Record<Language, string>;
  description: Record<Language, string>;
  bestFor: Record<Language, string>;
}

export interface VoicePreset {
  id: string;
  name: Record<Language, string>;
  voiceName: VoiceName;
  stylePrompt: string;
  category: Record<Language, string>;
  isCustom?: boolean;
}

export interface DialogueSpeakerConfig {
  speakerName: string;
  voiceName: VoiceName;
  stylePrompt: string;
}

export interface DialogueTurn {
  id: string;
  speakerRole: "A" | "B";
  text: string;
}

export interface AudioRecord {
  id: string;
  title: string;
  mode: StudioMode;
  textPreview: string;
  voiceSummary: string;
  styleSummary: string;
  model: string;
  createdAt: number;
  durationSeconds: number;
  fileSizeBytes: number;
  wavBlob: Blob;
}

export interface AppPreferences {
  language: Language;
  theme: Theme;
  playbackRate: number;
  customPresets: Array<{
    id: string;
    name: string;
    voiceName: VoiceName;
    stylePrompt: string;
  }>;
}
