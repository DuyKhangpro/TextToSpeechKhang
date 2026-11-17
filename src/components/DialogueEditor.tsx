import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Repeat, Trash2 } from "lucide-react";
import { EXPRESSION_TAGS } from "../data/voices";
import type { DialogueSpeakerConfig, DialogueTurn, Language } from "../types/tts";
import type { TranslationKey } from "../i18n/translations";

interface DialogueEditorProps {
  t: (key: TranslationKey) => string;
  language: Language;
  title: string;
  speakerA: DialogueSpeakerConfig;
  speakerB: DialogueSpeakerConfig;
  turns: DialogueTurn[];
  onChangeTitle: (val: string) => void;
  onChangeTurns: (turns: DialogueTurn[]) => void;
}

export function DialogueEditor({
  t,
  language,
  title,
  speakerA,
  speakerB,
  turns,
  onChangeTitle,
  onChangeTurns,
}: DialogueEditorProps) {
  const [focusedTurnId, setFocusedTurnId] = useState<string | null>(turns[0]?.id ?? null);
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateTurnText = (id: string, text: string) => {
    onChangeTurns(turns.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const toggleTurnSpeaker = (id: string) => {
    onChangeTurns(
      turns.map((item) =>
        item.id === id ? { ...item, speakerRole: item.speakerRole === "A" ? "B" : "A" } : item
      )
    );
  };

  const moveTurn = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= turns.length) return;
    const next = [...turns];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    onChangeTurns(next);
  };

  const deleteTurn = (id: string) => {
    if (turns.length <= 1) {
      onChangeTurns([{ ...turns[0], text: "" }]);
      return;
    }
    const next = turns.filter((item) => item.id !== id);
    onChangeTurns(next);
    if (focusedTurnId === id) {
      setFocusedTurnId(next[0]?.id ?? null);
    }
  };

  const addTurn = () => {
    const last = turns[turns.length - 1];
    const nextRole: "A" | "B" = last?.speakerRole === "A" ? "B" : "A";
    const newId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const next = [...turns, { id: newId, speakerRole: nextRole, text: "" }];
    onChangeTurns(next);
    setFocusedTurnId(newId);
    requestAnimationFrame(() => {
      inputRefs.current[newId]?.focus();
    });
  };

  const insertExpressionTag = (tag: string) => {
    const targetId = focusedTurnId && turns.some((x) => x.id === focusedTurnId)
      ? focusedTurnId
      : turns[0]?.id;
    if (!targetId) return;

    const targetTurn = turns.find((x) => x.id === targetId);
    if (!targetTurn) return;

    const el = inputRefs.current[targetId];
    const text = targetTurn.text;
    if (!el) {
      updateTurnText(targetId, text ? `${text} ${tag}` : tag);
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const padLeft = before && !before.endsWith(" ") && !before.endsWith("\n") ? " " : "";
    const padRight = after && !after.startsWith(" ") && !after.startsWith("\n") ? " " : "";
    const nextText = `${before}${padLeft}${tag}${padRight}${after}`;
    updateTurnText(targetId, nextText);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + padLeft.length + tag.length + padRight.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const totalChars = turns.reduce((acc, item) => acc + item.text.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("dialogueHeader")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t("dialogueSubtitle")}</p>
        </div>

        <button
          type="button"
          onClick={addTurn}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{t("addTurn")}</span>
        </button>
      </div>

      {/* Title & Expression Insertion Bar */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
            {turns.length} · {totalChars} {t("characters")}
          </span>
        </div>

        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("expressionBarLabel")}
          </span>
          {EXPRESSION_TAGS.map((item) => (
            <button
              key={item.tag}
              type="button"
              title={item.hint[language]}
              onClick={() => insertExpressionTag(item.tag)}
              className="px-2.5 py-1 rounded-md text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:border-[#60A5FA] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap"
            >
              {item.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Turns List */}
      <div className="space-y-3">
        {turns.map((turn, index) => {
          const isA = turn.speakerRole === "A";
          const speakerCfg = isA ? speakerA : speakerB;
          const isFocused = focusedTurnId === turn.id;

          return (
            <div
              key={turn.id}
              className={`border rounded-xl bg-white dark:bg-[#111827] transition-colors ${
                isFocused
                  ? "border-[#2563EB] dark:border-[#3B82F6]"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500 w-5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleTurnSpeaker(turn.id)}
                    title={t("swapSpeaker")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      isA
                        ? "bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-[#60A5FA]"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Repeat className="w-3 h-3" aria-hidden="true" />
                    <span>{speakerCfg.speakerName || (isA ? t("speakerALabel") : t("speakerBLabel"))}</span>
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {speakerCfg.voiceName}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveTurn(index, -1)}
                    disabled={index === 0}
                    aria-label={t("moveUp")}
                    title={t("moveUp")}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTurn(index, 1)}
                    disabled={index === turns.length - 1}
                    aria-label={t("moveDown")}
                    title={t("moveDown")}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTurn(turn.id)}
                    aria-label={t("deleteTurn")}
                    title={t("deleteTurn")}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={(el) => {
                  inputRefs.current[turn.id] = el;
                }}
                value={turn.text}
                onFocus={() => setFocusedTurnId(turn.id)}
                onChange={(e) => updateTurnText(turn.id, e.target.value)}
                placeholder={t("turnPlaceholder")}
                rows={2}
                className="w-full px-4 py-3 bg-transparent text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-y"
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addTurn}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:border-[#60A5FA] dark:hover:text-[#60A5FA] transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t("addTurn")}</span>
      </button>
    </div>
  );
}
