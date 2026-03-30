import type { ConvertSegment } from "./qt-engine.types";

export interface RuleContext {
  /** Full segment array */
  segments: ConvertSegment[];
  /** Current segment index */
  index: number;
  /** The current segment (shorthand for segments[index]) */
  seg: ConvertSegment;
  /** Get previous non-whitespace/punctuation segment. skip=0 → immediate prev, skip=1 → one before that, etc. */
  prev(skip?: number): ConvertSegment | null;
  /** Get next non-whitespace/punctuation segment */
  next(skip?: number): ConvertSegment | null;
  /** Index of previous non-whitespace segment (skip=0). Returns -1 if none. */
  prevIndex(skip?: number): number;
  /** Index of next non-whitespace segment */
  nextIndex(skip?: number): number;
  /** Search backward for a segment whose original contains any char in `chars`, within `maxDist` meaningful segments. Returns index or -1. */
  searchBack(chars: string, maxDist: number): number;
  /** Search forward for a segment whose original contains any char in `chars` */
  searchForward(chars: string, maxDist: number): number;
  /** True if current segment is at sentence start (after newline, sentence-ending punctuation, or very beginning) */
  isStartOfSentence: boolean;
  /** True if followed by sentence-ending punctuation */
  isEndOfSentence: boolean;
  /** True if segment is inside dialogue quotes */
  inDialogue: boolean;
  /** Check if a segment is a recognized name */
  isName(seg: ConvertSegment): boolean;
  /** Set translation of current segment */
  setTranslation(text: string): void;
  /** Set translation of segment at absolute index */
  setTranslationAt(idx: number, text: string): void;
  /** Clear a segment's translated text */
  clearSegment(idx: number): void;
}

export interface GrammarRule {
  /** Unique identifier for debugging */
  id: string;
  /** Chinese character(s) that trigger this rule — used for fast lookup */
  trigger: string;
  /** Priority within same trigger (lower = runs first) */
  priority: number;
  /** Test if rule should apply given current context */
  match(ctx: RuleContext): boolean;
  /** Apply the transformation */
  transform(ctx: RuleContext): void;
}
