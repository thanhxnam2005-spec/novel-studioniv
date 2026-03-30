/**
 * Core grammar rules for Chinese→Vietnamese translation post-processing.
 * Ported from QT Online's meanstrategy system, adapted to segment-based architecture.
 */

import type { GrammarRule, RuleContext } from "./grammar-types";

// ─── Helper: check if a segment contains a number ───────────

const NUMBER_RE = /[0-9一二三四五六七八九十百千万两亿几]/;
function containsNumber(seg: { original: string }): boolean {
  return NUMBER_RE.test(seg.original);
}

// ─── Polysemous word disambiguation ─────────────────────────

const polysemousRules: GrammarRule[] = [
  {
    id: "de-complement",
    trigger: "得",
    priority: 0,
    match: (ctx) => {
      // POS tag "ud" = structural particle 得 (complement marker)
      // When followed by a verb/adjective, it's a complement: 跑得快 → "chạy rất nhanh"
      if (ctx.seg.posTag === "ud") {
        const n = ctx.next();
        return !n || n.posTag !== "v";
      }
      return false;
    },
    transform: (ctx) => ctx.setTranslation("được"),
  },
  {
    id: "hua-loinoi",
    trigger: "话",
    priority: 0,
    match: (ctx) => {
      const p = ctx.prev();
      if (p && p.original.endsWith("的")) return true;
      return false;
    },
    transform: (ctx) => ctx.setTranslation("lời nói"),
  },
  {
    id: "hua-manoi",
    trigger: "话",
    priority: 1,
    match: (ctx) => {
      // If 如果 found within 10 segments back → conditional "mà nói"
      return ctx.searchBack("如", 10) >= 0;
    },
    transform: (ctx) => ctx.setTranslation("mà nói"),
  },
  {
    id: "ran-nhung",
    trigger: "然",
    priority: 0,
    match: (ctx) => {
      // Mid-sentence 然 → "nhưng" (however)
      const p = ctx.prev();
      return p !== null && !ctx.isStartOfSentence;
    },
    transform: (ctx) => ctx.setTranslation("nhưng"),
  },
  {
    id: "ruo-neu",
    trigger: "若",
    priority: 0,
    match: (ctx) => !ctx.prev() || ctx.isStartOfSentence,
    transform: (ctx) => ctx.setTranslation("nếu"),
  },
  {
    id: "queshi-laila",
    trigger: "却是",
    priority: 0,
    match: (ctx) => ctx.prev() !== null,
    transform: (ctx) => ctx.setTranslation("lại là"),
  },
  {
    id: "suowei-vandeji",
    trigger: "所谓",
    priority: 0,
    match: (ctx) => ctx.next() === null || ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("vấn đề gì"),
  },
  {
    id: "bucheng-haysao",
    trigger: "不成",
    priority: 0,
    match: (ctx) => {
      // Followed by ? punctuation
      const ni = ctx.nextIndex();
      if (ni < 0) return false;
      for (let k = ni; k < ctx.segments.length; k++) {
        const t =
          ctx.segments[k].source === "unknown"
            ? ctx.segments[k].original
            : ctx.segments[k].translated;
        if (t.trim() === "") continue;
        return t.includes("?") || t.includes("？");
      }
      return false;
    },
    transform: (ctx) => ctx.setTranslation("hay sao"),
  },
  {
    id: "hai-hoan",
    trigger: "还",
    priority: 0,
    match: (ctx) => ctx.next() === null || ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("hoàn"),
  },
  {
    id: "dang-coi",
    trigger: "当",
    priority: 0,
    match: (ctx) => ctx.searchForward("是", 3) >= 0,
    transform: (ctx) => ctx.setTranslation("coi"),
  },
  {
    id: "dang-khi",
    trigger: "当",
    priority: 1,
    match: (ctx) => !ctx.isStartOfSentence && ctx.prev() !== null,
    transform: (ctx) => ctx.setTranslation("khi"),
  },
  {
    id: "dui-dung",
    trigger: "对",
    priority: 0,
    match: (ctx) => ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("đúng"),
  },
  {
    id: "keneng-khanang",
    trigger: "可能",
    priority: 0,
    match: (ctx) => ctx.next() === null || ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("khả năng"),
  },
  {
    id: "yuanlai-thira",
    trigger: "原来",
    priority: 0,
    match: (ctx) => ctx.isStartOfSentence,
    transform: (ctx) => ctx.setTranslation("Thì ra"),
  },
  {
    id: "zongshi-noichung",
    trigger: "总是",
    priority: 0,
    match: (ctx) => ctx.isStartOfSentence,
    transform: (ctx) => ctx.setTranslation("Nói chung"),
  },
  {
    id: "naihe-lamgi",
    trigger: "奈何",
    priority: 0,
    match: (ctx) => !ctx.prev() || ctx.isStartOfSentence,
    transform: (ctx) => ctx.setTranslation("làm gì"),
  },
];

// ─── Location/direction transforms ──────────────────────────
// Merge location word into preceding preposition (在/从/于)

function makeLocationMergeRule(
  id: string,
  trigger: string,
  viet: string,
  searchChars = "在从于",
  maxDist = 4,
): GrammarRule {
  return {
    id,
    trigger,
    priority: 10,
    match: (ctx) => ctx.searchBack(searchChars, maxDist) >= 0,
    transform: (ctx) => {
      const prepIdx = ctx.searchBack(searchChars, maxDist);
      if (prepIdx >= 0) {
        const prepSeg = ctx.segments[prepIdx];
        ctx.setTranslationAt(
          prepIdx,
          prepSeg.translated + " " + viet,
        );
        ctx.setTranslation("");
      }
    },
  };
}

const locationRules: GrammarRule[] = [
  makeLocationMergeRule("mianqian-merge", "面前", "trước mặt", "在从于", 3),
  makeLocationMergeRule("tuzhong-merge", "途中", "trên đường", "在从于", 6),
  makeLocationMergeRule("fangmian-merge", "方面", "phương diện", "在从于", 3),
  makeLocationMergeRule("limian-merge", "里面", "bên trong", "在从于", 4),
  makeLocationMergeRule("libian-merge", "里边", "bên trong", "在从于", 4),
];

// ─── Name-position swaps ────────────────────────────────────
// Vietnamese puts location before the name: "trong tay" + Name → "Trong tay Name"

function makeNameSwapRule(
  id: string,
  trigger: string,
  vietPrefix: string,
): GrammarRule {
  return {
    id,
    trigger,
    priority: 10,
    match: (ctx) => {
      const p = ctx.prev();
      return p !== null && ctx.isName(p);
    },
    transform: (ctx) => {
      const pi = ctx.prevIndex();
      if (pi < 0) return;
      const nameSeg = ctx.segments[pi];
      // Swap: put location first, then name
      ctx.setTranslationAt(pi, vietPrefix + " " + nameSeg.translated);
      ctx.setTranslation("");
    },
  };
}

const nameSwapRules: GrammarRule[] = [
  makeNameSwapRule("shouzhong-swap", "手中", "Trong tay"),
  makeNameSwapRule("xinzhong-swap", "心中", "Trong lòng"),
  makeNameSwapRule("shenhou-swap", "身后", "Sau lưng"),
  makeNameSwapRule("shenbian-swap", "身边", "Bên cạnh"),
  makeNameSwapRule("yanzhong-swap", "眼中", "Trong mắt"),
  makeNameSwapRule("shenshang-swap", "身上", "Trên người"),
  makeNameSwapRule("xiafang-swap", "下方", "Phía dưới"),
];

// ─── Redundancy removal ─────────────────────────────────────

const redundancyRules: GrammarRule[] = [
  {
    id: "qilai-remove",
    trigger: "起来",
    priority: 10,
    match: (ctx) => {
      const p = ctx.prev();
      if (!p) return false;
      return (
        p.translated.includes("bắt đầu") || p.translated.includes("biến thành")
      );
    },
    transform: (ctx) => ctx.setTranslation(""),
  },
  {
    id: "biande-remove",
    trigger: "变得",
    priority: 10,
    match: (ctx) => {
      const n = ctx.next();
      return n !== null && n.translated.includes("trở nên");
    },
    transform: (ctx) => ctx.setTranslation(""),
  },
  {
    id: "qing-remove",
    trigger: "情",
    priority: 10,
    match: (ctx) => {
      const p = ctx.prev();
      return p !== null && p.original.endsWith("事");
    },
    transform: (ctx) => ctx.setTranslation(""),
  },
];

// ─── A不A pattern ───────────────────────────────────────────

const aBuARules: GrammarRule[] = [
  {
    id: "abu-haykhong",
    trigger: "不",
    priority: 10,
    match: (ctx) => {
      const p = ctx.prev();
      const n = ctx.next();
      return p !== null && n !== null && p.original === n.original;
    },
    transform: (ctx) => {
      const ni = ctx.nextIndex();
      if (ni >= 0) ctx.clearSegment(ni);
      ctx.setTranslation("hay không");
    },
  },
];

// ─── Other context rules ────────────────────────────────────

const contextRules: GrammarRule[] = [
  {
    id: "dibu-tinhcanh",
    trigger: "地步",
    priority: 10,
    match: (ctx) => ctx.searchBack("到", 10) >= 0,
    transform: (ctx) => {
      const daoIdx = ctx.searchBack("到", 10);
      if (daoIdx >= 0) {
        ctx.setTranslationAt(
          daoIdx,
          ctx.segments[daoIdx].translated + " tình cảnh",
        );
        ctx.setTranslation("");
      }
    },
  },
  {
    id: "guang-chi",
    trigger: "光",
    priority: 10,
    match: (ctx) => {
      if (ctx.prev() !== null) return false;
      return ctx.searchForward("来过就", 7) >= 0;
    },
    transform: (ctx) => ctx.setTranslation("chỉ"),
  },
  {
    id: "yue-vuot",
    trigger: "越",
    priority: 10,
    match: (ctx) => {
      const n = ctx.next();
      return n !== null && containsNumber(n);
    },
    transform: (ctx) => ctx.setTranslation("vượt"),
  },
  {
    id: "yeshi-cungdung",
    trigger: "也是",
    priority: 10,
    match: (ctx) => ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("cũng đúng"),
  },
  {
    id: "zuoyou-trendui",
    trigger: "左右",
    priority: 10,
    match: (ctx) => {
      const p = ctx.prev();
      return p !== null && containsNumber(p);
    },
    transform: (ctx) => ctx.setTranslation("trên dưới"),
  },
  {
    id: "duibuqi-xinloi",
    trigger: "对不起",
    priority: 0,
    match: (ctx) => ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("thật xin lỗi"),
  },
  {
    id: "shuozhe-noixong",
    trigger: "说着",
    priority: 0,
    match: (ctx) => !ctx.prev() || ctx.isStartOfSentence,
    transform: (ctx) => ctx.setTranslation("nói xong"),
  },
  {
    id: "yingzhe-daploi",
    trigger: "应着",
    priority: 0,
    match: (ctx) => ctx.next() === null || ctx.isEndOfSentence,
    transform: (ctx) => ctx.setTranslation("đáp lời"),
  },
  {
    id: "tanhe-noichila",
    trigger: "谈何",
    priority: 0,
    match: (ctx) => ctx.next() !== null,
    transform: (ctx) => ctx.setTranslation("nói chi là"),
  },
  {
    id: "haigei-tracho",
    trigger: "还给",
    priority: 0,
    match: (ctx) => {
      const p = ctx.prev();
      return p !== null && ctx.isName(p);
    },
    transform: (ctx) => ctx.setTranslation("trả cho"),
  },
  {
    id: "xiaoluo-tungtinh",
    trigger: "下落",
    priority: 0,
    match: (ctx) => {
      const p = ctx.prev();
      return p !== null && p.original.endsWith("的");
    },
    transform: (ctx) => ctx.setTranslation("tung tích"),
  },
  {
    id: "jiaoqu-chonho",
    trigger: "借口",
    priority: 10,
    match: (ctx) => ctx.searchBack("着", 5) >= 0,
    transform: (ctx) => {
      const zheIdx = ctx.searchBack("着", 5);
      if (zheIdx >= 0) {
        ctx.setTranslationAt(
          zheIdx,
          ctx.segments[zheIdx].translated + " cớ",
        );
        ctx.setTranslation("");
      }
    },
  },
  {
    id: "rang-decho",
    trigger: "让",
    priority: 0,
    match: (ctx) => {
      const n = ctx.next();
      return (!ctx.prev() || ctx.isStartOfSentence) || (n !== null && n.original.length > 1);
    },
    transform: (ctx) => ctx.setTranslation("để cho"),
  },
];

// ─── Category transforms (faction, skill, item, title) ──────

import {
  FACTION_SUFFIXES,
  FACTION_MULTI_SUFFIXES,
  SKILL_SUFFIXES,
  SKILL_IGNORE,
  TITLE_SUFFIXES_SINGLE,
  TITLE_SUFFIXES_MULTI,
  PRONOUNS,
  isCJK,
  NAME_SOURCES,
} from "./qt-engine.constants";
import { capitalizeWords } from "./qt-engine.constants";

/**
 * Walk backward from `index` up to `maxSteps` meaningful segments.
 * Return the indices of consecutive CJK segments that form a potential name/faction/skill prefix.
 */
function collectPrecedingCJK(
  ctx: { segments: { original: string; source: string }[] },
  index: number,
  maxSteps: number,
): number[] {
  const indices: number[] = [];
  let count = 0;
  for (let k = index - 1; k >= 0 && count < maxSteps; k--) {
    const seg = ctx.segments[k];
    if (seg.source === "unknown") continue;
    // Must be CJK content
    if (!isCJK(seg.original[0])) break;
    indices.unshift(k);
    count++;
  }
  return indices;
}

/** Faction detection: single-char suffix triggers, titleCase preceding chars */
const factionSuffixRules: GrammarRule[] = [...FACTION_SUFFIXES].map((ch) => ({
  id: `faction-${ch}`,
  trigger: ch,
  priority: 20,
  match: (ctx: RuleContext) => {
    // Must have 1-3 preceding CJK segments that are NOT names already
    const preceding = collectPrecedingCJK(ctx, ctx.index, 3);
    if (preceding.length === 0) return false;
    // At least one preceding segment must not be a name (avoid double-processing)
    return preceding.some((i) => !NAME_SOURCES.has(ctx.segments[i].source));
  },
  transform: (ctx: RuleContext) => {
    const preceding = collectPrecedingCJK(ctx, ctx.index, 3);
    for (const i of preceding) {
      ctx.setTranslationAt(i, capitalizeWords(ctx.segments[i].translated));
    }
  },
}));

/** Faction multi-char suffix rules */
const factionMultiRules: GrammarRule[] = [...FACTION_MULTI_SUFFIXES].map(
  (suffix) => ({
    id: `faction-m-${suffix}`,
    trigger: suffix,
    priority: 20,
    match: (ctx: RuleContext) => {
      const preceding = collectPrecedingCJK(ctx, ctx.index, 3);
      return preceding.length > 0;
    },
    transform: (ctx: RuleContext) => {
      const preceding = collectPrecedingCJK(ctx, ctx.index, 3);
      for (const i of preceding) {
        ctx.setTranslationAt(i, capitalizeWords(ctx.segments[i].translated));
      }
      ctx.setTranslation(capitalizeWords(ctx.seg.translated));
    },
  }),
);

/** Skill detection: single-char suffix triggers */
const skillSuffixRules: GrammarRule[] = [...SKILL_SUFFIXES].map((ch) => ({
  id: `skill-${ch}`,
  trigger: ch,
  priority: 21,
  match: (ctx: RuleContext) => {
    // Skip ignored phrases
    const preceding = collectPrecedingCJK(ctx, ctx.index, 4);
    if (preceding.length === 0) return false;
    const fullOriginal =
      preceding.map((i) => ctx.segments[i].original).join("") +
      ctx.seg.original;
    if (SKILL_IGNORE.has(fullOriginal)) return false;
    return true;
  },
  transform: (ctx: RuleContext) => {
    const preceding = collectPrecedingCJK(ctx, ctx.index, 4);
    for (const i of preceding) {
      ctx.setTranslationAt(i, capitalizeWords(ctx.segments[i].translated));
    }
    ctx.setTranslation(capitalizeWords(ctx.seg.translated));
  },
}));

/** Title suffix handling: lowercase the suffix portion when following a name */
const titleSuffixRules: GrammarRule[] = [
  ...[...TITLE_SUFFIXES_SINGLE].map((ch) => ({
    id: `title-${ch}`,
    trigger: ch,
    priority: 25,
    match: (ctx: RuleContext) => {
      const p = ctx.prev();
      return p !== null && NAME_SOURCES.has(p.source);
    },
    transform: (ctx: RuleContext) => {
      // Keep translated text lowercase (it should already be, but ensure)
      ctx.setTranslation(ctx.seg.translated.toLowerCase());
    },
  })),
  ...[...TITLE_SUFFIXES_MULTI].map((suffix) => ({
    id: `title-m-${suffix}`,
    trigger: suffix,
    priority: 25,
    match: (ctx: RuleContext) => {
      const p = ctx.prev();
      return p !== null && NAME_SOURCES.has(p.source);
    },
    transform: (ctx: RuleContext) => {
      ctx.setTranslation(ctx.seg.translated.toLowerCase());
    },
  })),
];

// ─── Pattern rules (demonstrative, possessive, comparative) ─

const patternRules: GrammarRule[] = [
  // Possessive 的 reordering: pronoun + 的 + noun → noun + "của" + pronoun
  {
    id: "possessive-de-pronoun",
    trigger: "的",
    priority: 30,
    match: (ctx) => {
      const p = ctx.prev();
      const n = ctx.next();
      if (!p || !n) return false;
      // Previous is a pronoun
      if (!PRONOUNS.has(p.original)) return false;
      // Next is a noun (POS n, nr, ns, etc.) or has no POS (fallback: any non-particle)
      if (n.posTag) {
        return n.posTag.startsWith("n") || n.posTag === "v";
      }
      return n.source !== "unknown";
    },
    transform: (ctx) => {
      const pi = ctx.prevIndex();
      const ni = ctx.nextIndex();
      if (pi < 0 || ni < 0) return;
      const pronounTranslated = ctx.segments[pi].translated;
      // Reorder: noun + "của" + pronoun
      ctx.setTranslationAt(pi, "");
      ctx.setTranslation("của " + pronounTranslated);
    },
  },
  // Demonstrative reordering: 这/那 + noun → noun + "này"/"kia"
  {
    id: "demonstrative-zhe",
    trigger: "这",
    priority: 30,
    match: (ctx) => {
      const n = ctx.next();
      if (!n) return false;
      // Next is a noun-like segment
      return n.source !== "unknown" && n.posTag !== "v" && n.posTag !== "p";
    },
    transform: (ctx) => {
      // Don't reorder — just ensure "này" is the translation
      ctx.setTranslation("này");
    },
  },
  {
    id: "demonstrative-na",
    trigger: "那",
    priority: 30,
    match: (ctx) => {
      const n = ctx.next();
      if (!n) return false;
      return n.source !== "unknown" && n.posTag !== "v" && n.posTag !== "p";
    },
    transform: (ctx) => {
      ctx.setTranslation("kia");
    },
  },
];

// ─── Export all rules ───────────────────────────────────────

export const ALL_GRAMMAR_RULES: GrammarRule[] = [
  ...polysemousRules,
  ...locationRules,
  ...nameSwapRules,
  ...redundancyRules,
  ...aBuARules,
  ...contextRules,
  ...factionSuffixRules,
  ...factionMultiRules,
  ...skillSuffixRules,
  ...titleSuffixRules,
  ...patternRules,
];
