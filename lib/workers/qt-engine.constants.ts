import type { ConvertSource } from "./qt-engine.types";

export const NAME_SOURCES = new Set<ConvertSource>([
  "qt-name",
  "novel-name",
  "global-name",
]);

export const SENTENCE_ENDERS = /[.!?。！？…\n：:；;]/;
export const CAP_TRIGGERS = /[《«]/;
export const CAP_PASSTHROUGH =
  /^[\s\u3000""''「『（(\[{<》」』）\])}>《》«»，、；：,.:;!?。！？…～·\-–—\u201c\u201d\u2018\u2019]+$/;

export const NO_SPACE_BEFORE =
  /[,.:;!?。，、；：！？…\u201d\u2019」』）\])}>》»～·\-–—\s]/;
export const NO_SPACE_AFTER = /[\u201c\u2018「『（\[({<《«\s]/;
export const DIGIT_TRAILING = /\d$/;
export const DIGIT_LEADING = /^\d/;

export const BRACKET_OPEN = /[《«]/;
export const BRACKET_CLOSE = /[》»]/;

// ─── Full-width → ASCII punctuation ─────────────────────────

export const FULLWIDTH_PUNCT: Record<string, string> = {
  "，": ",",
  "。": ".",
  "：": ":",
  "；": ";",
  "！": "!",
  "？": "?",
  "（": "(",
  "）": ")",
  "【": "[",
  "】": "]",
  "、": ",",
  "～": "~",
  "「": "\u201C",
  "」": "\u201D",
  "『": "\u2018",
  "』": "\u2019",
  "\u3000": " ",
  "…": "...",
  "……": "...",
};

const FULLWIDTH_RE = new RegExp(
  Object.keys(FULLWIDTH_PUNCT)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

export function normalizeFullwidthPunct(text: string): string {
  return text.replace(FULLWIDTH_RE, (m) => FULLWIDTH_PUNCT[m] ?? m);
}

// ─── Particle overrides ──────────────────────────────────────

export const PARTICLE_OVERRIDES: Record<string, string> = {
  的: "của",
  了: "",
  着: "đang",
  过: "qua",
  吗: "sao",
  呢: "đây",
  吧: "đi",
  啊: "a",
  哦: "ồ",
  嗯: "ừ",
  哈: "ha",
  啦: "rồi",
  嘛: "mà",
  呀: "a",
  哩: "lý",
  喽: "rồi",
};

/** Chinese suffixes that capitalize when following a name (geographic, titles, orgs) */
export const NAME_SUFFIXES = new Set(
  "省市县区镇村山河湖海岛峰谷关城宫殿阁楼塔寺庙庄府院堂门派宗帝王皇后妃侯公伯子爵将帅族氏家國国".split(
    "",
  ),
);
