import type { GrammarRule, RuleContext } from "./grammar-types";
import type { ConvertSegment } from "./qt-engine.types";
import { NAME_SOURCES, SENTENCE_ENDERS } from "./qt-engine.constants";

/** Index rules by trigger string for O(1) lookup */
export function buildRuleIndex(
  rules: GrammarRule[],
): Map<string, GrammarRule[]> {
  const index = new Map<string, GrammarRule[]>();
  for (const rule of rules) {
    const list = index.get(rule.trigger) ?? [];
    list.push(rule);
    index.set(rule.trigger, list);
  }
  for (const list of index.values()) {
    list.sort((a, b) => a.priority - b.priority);
  }
  return index;
}

/** Check if a segment is whitespace/punctuation (source "unknown") */
function isWhitespace(seg: ConvertSegment): boolean {
  return seg.source === "unknown";
}

/** Check if text is a sentence ender */
function isSentenceEnder(text: string): boolean {
  return SENTENCE_ENDERS.test(text);
}

/** Create a RuleContext for a given segment position */
function createContext(
  segments: ConvertSegment[],
  index: number,
): RuleContext {
  const seg = segments[index];

  // Navigate to prev/next skipping whitespace segments
  function prevIndex(skip = 0): number {
    let count = 0;
    for (let k = index - 1; k >= 0; k--) {
      if (!isWhitespace(segments[k])) {
        if (count === skip) return k;
        count++;
      }
    }
    return -1;
  }

  function nextIndex(skip = 0): number {
    let count = 0;
    for (let k = index + 1; k < segments.length; k++) {
      if (!isWhitespace(segments[k])) {
        if (count === skip) return k;
        count++;
      }
    }
    return -1;
  }

  function prev(skip = 0): ConvertSegment | null {
    const idx = prevIndex(skip);
    return idx >= 0 ? segments[idx] : null;
  }

  function next(skip = 0): ConvertSegment | null {
    const idx = nextIndex(skip);
    return idx >= 0 ? segments[idx] : null;
  }

  function searchBack(chars: string, maxDist: number): number {
    let count = 0;
    for (let k = index - 1; k >= 0; k--) {
      if (isWhitespace(segments[k])) continue;
      count++;
      if (count > maxDist) break;
      for (const ch of chars) {
        if (segments[k].original.includes(ch)) return k;
      }
    }
    return -1;
  }

  function searchForward(chars: string, maxDist: number): number {
    let count = 0;
    for (let k = index + 1; k < segments.length; k++) {
      if (isWhitespace(segments[k])) continue;
      count++;
      if (count > maxDist) break;
      for (const ch of chars) {
        if (segments[k].original.includes(ch)) return k;
      }
    }
    return -1;
  }

  // Detect sentence boundaries
  let isStartOfSentence = false;
  if (index === 0) {
    isStartOfSentence = true;
  } else {
    for (let k = index - 1; k >= 0; k--) {
      const s = segments[k];
      const text = s.source === "unknown" ? s.original : s.translated;
      if (text.trim() === "") continue;
      if (isSentenceEnder(text) || text.includes("\n")) {
        isStartOfSentence = true;
      }
      break;
    }
  }

  let isEndOfSentence = false;
  for (let k = index + 1; k < segments.length; k++) {
    const s = segments[k];
    const text = s.source === "unknown" ? s.original : s.translated;
    if (text.trim() === "") continue;
    if (isSentenceEnder(text)) {
      isEndOfSentence = true;
    }
    break;
  }

  return {
    segments,
    index,
    seg,
    prev,
    next,
    prevIndex,
    nextIndex,
    searchBack,
    searchForward,
    isStartOfSentence,
    isEndOfSentence,
    inDialogue: seg.inDialogue ?? false,
    isName: (s) => NAME_SOURCES.has(s.source),
    setTranslation: (text) => {
      segments[index] = { ...segments[index], translated: text };
    },
    setTranslationAt: (idx, text) => {
      if (idx >= 0 && idx < segments.length) {
        segments[idx] = { ...segments[idx], translated: text };
      }
    },
    clearSegment: (idx) => {
      if (idx >= 0 && idx < segments.length) {
        segments[idx] = { ...segments[idx], translated: "" };
      }
    },
  };
}

/** Apply all matching rules to the segment array */
export function applyGrammarRules(
  segments: ConvertSegment[],
  ruleIndex: Map<string, GrammarRule[]>,
): void {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.source === "unknown") continue;

    const rules = ruleIndex.get(seg.original);
    if (!rules) continue;

    const ctx = createContext(segments, i);
    for (const rule of rules) {
      if (rule.match(ctx)) {
        rule.transform(ctx);
        break; // first matching rule wins
      }
    }
  }
}
