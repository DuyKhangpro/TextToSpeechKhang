import "dotenv/config";
import express, { type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const VALID_VOICES = new Set(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("GEMINI_API_KEY is not configured on the server."), {
      status: 500,
      code: "MISSING_API_KEY",
    });
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function extractInlineAudio(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
      }>;
    };
  }>;
}): string | null {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }
  return null;
}

function parseReadableErrorMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: { message?: string };
        message?: string;
      };
      if (parsed?.error?.message) return parsed.error.message;
      if (parsed?.message) return parsed.message;
    } catch {
      // Fallback to raw message
    }
  }
  return rawMessage;
}

function formatApiError(err: unknown): { status: number; error: string; code: string } {
  const anyErr = err as { status?: number; code?: string; message?: string };
  const rawMessage = anyErr?.message || "Unknown server error";
  const message = parseReadableErrorMessage(rawMessage);
  const status = typeof anyErr?.status === "number" ? anyErr.status : 500;

  if (status === 403 || rawMessage.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      code: "PERMISSION_DENIED",
      error: "API key lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (status === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      code: "RATE_LIMIT",
      error: "Rate limit or quota reached. Please wait a moment and try again.",
    };
  }
  if (status === 400 || rawMessage.includes("API_KEY_INVALID")) {
    return {
      status: 400,
      code: "INVALID_REQUEST",
      error: message,
    };
  }
  return {
    status,
    code: anyErr?.code || "INTERNAL_ERROR",
    error: message,
  };
}

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/tts/single", async (req: Request, res: Response) => {
  try {
    const { text, voiceName, stylePrompt, useProEngine } = req.body as {
      text?: string;
      voiceName?: string;
      stylePrompt?: string;
      useProEngine?: boolean;
    };

    const cleanText = (text || "").trim();
    if (!cleanText) {
      res.status(400).json({ error: "Text cannot be empty.", code: "EMPTY_INPUT" });
      return;
    }

    const safeVoice = VALID_VOICES.has(voiceName || "") ? (voiceName as string) : "Kore";
    const cleanStyle = (stylePrompt || "").trim();
    const hasVocalTags = /<(laugh|gasp|breath)>|\|(mhm|yeah)\|/i.test(cleanText);
    const model = useProEngine || hasVocalTags ? "gemini-3.8-flash-tts" : "gemini-3.8-flash-lite-tts";

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
              ...(cleanStyle ? { speechMetadata: { style: cleanStyle } } : {}),
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: safeVoice },
          },
        },
      },
    });

    const audioBase64 = extractInlineAudio(response);
    if (!audioBase64) {
      res.status(502).json({
        error: "No audio data returned by the speech model.",
        code: "NO_AUDIO_RETURNED",
      });
      return;
    }

    res.json({
      audioBase64,
      mimeType: "audio/wav",
      model,
    });
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.error, code: formatted.code });
  }
});

app.post("/api/tts/dialogue", async (req: Request, res: Response) => {
  try {
    const { turns, speakerA, speakerB } = req.body as {
      turns?: Array<{ speakerRole: "A" | "B"; text: string }>;
      speakerA?: { speakerName: string; voiceName: string; stylePrompt?: string };
      speakerB?: { speakerName: string; voiceName: string; stylePrompt?: string };
    };

    const validTurns = (turns || []).filter((t) => (t.text || "").trim().length > 0);
    if (validTurns.length === 0) {
      res.status(400).json({ error: "Dialogue needs at least one spoken line.", code: "EMPTY_INPUT" });
      return;
    }

    const nameA = (speakerA?.speakerName || "Minh").trim() || "Minh";
    let nameB = (speakerB?.speakerName || "Linh").trim() || "Linh";
    if (nameB.toLowerCase() === nameA.toLowerCase()) {
      nameB = `${nameB} 2`;
    }

    const voiceA = VALID_VOICES.has(speakerA?.voiceName || "") ? (speakerA!.voiceName as string) : "Puck";
    const voiceB = VALID_VOICES.has(speakerB?.voiceName || "") ? (speakerB!.voiceName as string) : "Kore";
    const styleA = (speakerA?.stylePrompt || "").trim();
    const styleB = (speakerB?.stylePrompt || "").trim();

    const parts = validTurns.map((turn) => {
      const isA = turn.speakerRole === "A";
      const speaker = isA ? nameA : nameB;
      const style = isA ? styleA : styleB;
      return {
        text: `${speaker}: ${turn.text.trim()}`,
        speechMetadata: {
          speaker,
          ...(style ? { style } : {}),
        },
      };
    });

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-tts",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: nameA,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } },
              },
              {
                speaker: nameB,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } },
              },
            ],
          },
        },
      },
    });

    const audioBase64 = extractInlineAudio(response);
    if (!audioBase64) {
      res.status(502).json({
        error: "No dialogue audio returned by the speech model.",
        code: "NO_AUDIO_RETURNED",
      });
      return;
    }

    res.json({
      audioBase64,
      mimeType: "audio/wav",
      model: "gemini-3.8-flash-tts",
    });
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.error, code: formatted.code });
  }
});

app.post("/api/tts/preview", async (req: Request, res: Response) => {
  try {
    const { voiceName, language, stylePrompt } = req.body as {
      voiceName?: string;
      language?: "vi" | "en";
      stylePrompt?: string;
    };
    const safeVoice = VALID_VOICES.has(voiceName || "") ? (voiceName as string) : "Kore";
    const sampleText =
      language === "en"
        ? `Hello, I am ${safeVoice}. Welcome to ThanhAm Studio, where your scripts come alive.`
        : `Xin chào, mình là ${safeVoice}. Chào mừng bạn đến với phòng thu Thanh Âm.`;

    const cleanStyle = (stylePrompt || "").trim();
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: sampleText,
              ...(cleanStyle ? { speechMetadata: { style: cleanStyle } } : {}),
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: safeVoice },
          },
        },
      },
    });

    const audioBase64 = extractInlineAudio(response);
    if (!audioBase64) {
      res.status(502).json({ error: "Preview audio unavailable.", code: "NO_AUDIO_RETURNED" });
      return;
    }

    res.json({ audioBase64, mimeType: "audio/wav" });
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.error, code: formatted.code });
  }
});

app.post("/api/script/assist", async (req: Request, res: Response) => {
  try {
    const { text, action, tone, targetLanguage, speakerAName, speakerBName, uiLanguage } = req.body as {
      text?: string;
      action?: "optimize" | "rewrite" | "translate" | "to_dialogue";
      tone?: string;
      targetLanguage?: string;
      speakerAName?: string;
      speakerBName?: string;
      uiLanguage?: "vi" | "en";
    };

    const cleanText = (text || "").trim();
    if (!cleanText) {
      res.status(400).json({ error: "Script text cannot be empty.", code: "EMPTY_INPUT" });
      return;
    }

    const ai = getAiClient();

    if (action === "to_dialogue") {
      const nameA = (speakerAName || "Minh").trim() || "Minh";
      const nameB = (speakerBName || "Linh").trim() || "Linh";
      const langInstruction =
        uiLanguage === "en"
          ? "Keep the dialogue in the same language as the source text (or English if ambiguous)."
          : "Giữ nguyên ngôn ngữ của văn bản gốc (ưu tiên tiếng Việt tự nhiên nếu văn bản là tiếng Việt).";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Convert the following content into a lively, natural 2-speaker podcast dialogue between Speaker A (${nameA}) and Speaker B (${nameB}). ${langInstruction}
You may occasionally include natural vocal cues like <breath>, <laugh>, <gasp>, |mhm|, or |yeah| where appropriate so it sounds realistic when read aloud.
Return 4 to 8 concise, well-paced turns.

Source text:
${cleanText}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speakerRole: {
                  type: Type.STRING,
                  description: "Must be either 'A' or 'B'.",
                },
                text: {
                  type: Type.STRING,
                  description: "Spoken dialogue line without speaker name prefix.",
                },
              },
              required: ["speakerRole", "text"],
            },
          },
        },
      });

      const raw = (response.text || "[]").trim();
      const parsed = JSON.parse(raw) as Array<{ speakerRole: string; text: string }>;
      const sanitized = parsed
        .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
        .map((item) => ({
          speakerRole: item.speakerRole === "B" ? ("B" as const) : ("A" as const),
          text: item.text.trim(),
        }));

      res.json({ turns: sanitized });
      return;
    }

    let instruction = "";
    if (action === "optimize") {
      instruction =
        "Optimize the following script for Text-to-Speech narration. Improve punctuation, natural phrasing, breathing pauses (commas/ellipses where helpful), and expand awkward abbreviations into speakable words while keeping the exact meaning and language. Return ONLY the improved script text without explanations or markdown.";
    } else if (action === "rewrite") {
      instruction = `Rewrite the following script in a "${tone || "engaging podcast"}" style so it sounds natural, compelling, and effortless when spoken aloud. Preserve the original language unless specified otherwise. Return ONLY the rewritten script text without quotes or commentary.`;
    } else if (action === "translate") {
      instruction = `Translate the following script into ${targetLanguage || "English"} so it sounds completely natural and idiomatic when read aloud by a native voice actor. Return ONLY the translated text without explanations.`;
    } else {
      res.status(400).json({ error: "Invalid script assist action.", code: "INVALID_ACTION" });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `${instruction}\n\nScript:\n${cleanText}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.json({ resultText: (response.text || "").trim() });
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.error, code: formatted.code });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ThanhÂm Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
