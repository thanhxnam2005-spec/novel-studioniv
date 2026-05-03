/**
 * Clean up Vietnamese text:
 * - Replace multiple spaces with a single space.
 * - Fix spacing around punctuation.
 * - Trim lines.
 */
export function cleanVietnameseText(text: string): string {
  if (!text) return "";

  return text
    // Replace multiple spaces with a single space
    .replace(/[ \t]+/g, " ")
    // Fix spacing before punctuation: "word , " -> "word, "
    .replace(/\s+([,.!?;:])/g, "$1")
    // Fix spacing after punctuation if missing: "word,word" -> "word, word" (careful with numbers)
    .replace(/([,.!?;:])(?=[a-zA-Z\u00C0-\u1EF9])/g, "$1 ")
    // Fix multiple newlines: more than 2 -> 2
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

/**
 * Attempts to fix stuck words and split words in Vietnamese text.
 */
export function fixStuckWords(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Fix split characters (e.g., "t r ời" -> "trời", "b ình" -> "bình", "ng ơ" -> "ngơ")
  // Rule: if a word is a single consonant/vowel followed by a space and then something starting with a vowel/accent
  // We look for patterns like: [consonant] [space] [vowel with accent]
  // Consonants: b, c, d, đ, g, h, k, l, m, n, p, q, r, s, t, v, x
  // Vowels: a, e, i, o, u, y, ư, ơ, â, ê, ô
  
  // Pattern to merge single letters separated by spaces if they form Vietnamese sounds
  // This is a complex one, let's target the specific common splits first
  const splitPatterns = [
    { pattern: /\b(b|c|d|đ|g|h|k|l|m|n|p|q|r|s|t|v|x|gi|qu|th|ph|nh|ch|tr|ng|ngh)\s+([aáàảãạeéèẻẽẹiíìỉĩịoóòỏõọuúùủũụyýỳỷỹỵưứừửữựơớờởỡợâấầẩẫậêếềểễệôốồổỗộ])/gi, replacement: "$1$2" },
    { pattern: /([aáàảãạeéèẻẽẹiíìỉĩịoóòỏõọuúùủũụyýỳỷỹỵưứừửữựơớờởỡợâấầẩẫậêếềểễệôốồổỗộ])\s+([\u0300-\u036f])/g, replacement: "$1$2" }, // Merge combining diacritics
    { pattern: /\b(gi|qu|th|ph|nh|ch|tr|ng|ngh)\s+([a-z\u00C0-\u1EF9])/gi, replacement: "$1$2" },
  ];

  splitPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  // Repeat once to catch cases like "t r ơ" -> "tr ơ" -> "trơ"
  splitPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  // 2. Fix stuck words (e.g., "làTòng" -> "là Tòng")
  const stuckPatterns = [
    // Common stuck words (particle/verb/adverb stuck to previous word)
    { pattern: /([a-z\u00C0-\u1EF9])(là|không|có|cũng|theo|tại|khỏi|rất|như|thế|cái|mấy|với|mà|của|được|những|một|đã|đang|sẽ|rời|định|tinh|cảnh|mặc|nghĩ|nhận|thần|coi|gầy|tiếp|vừa|vẫn|còn|nữa)/g, replacement: "$1 $2" },
    // Handle lowercase followed by Uppercase (e.g. làTòng -> là Tòng)
    { pattern: /([a-z\u00C0-\u1EF9])([A-Z\u00C0-\u1EF9])/g, replacement: "$1 $2" },
  ];

  stuckPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  return cleaned;
}
