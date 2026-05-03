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
 * Attempts to fix stuck words in Vietnamese text.
 * This is heuristic-based and uses common Vietnamese word patterns.
 */
export function fixStuckWords(text: string): string {
  if (!text) return "";

  // Common Vietnamese words that often get stuck
  // This is a very basic list.
  const commonWords = [
    "là", "của", "được", "trong", "có", "cho", "và", "với", "như", "khi",
    "người", "những", "một", "tên", "thật", "gọi", "đến", "không", "mà", "lại",
    "ra", "vào", "lên", "xuống", "đi", "đã", "đang", "sẽ"
  ];

  let cleaned = text;

  // Heuristic: if a common word is followed by another word without a space
  // We can't easily do this without a full dictionary or knowing the boundaries.
  // But we can look for specific cases requested by the user like "thậtgọi"
  
  // Rule: if we see "thật" + another word, insert space
  // We need to be careful not to break longer words if any.
  // In Vietnamese, words are mostly 1-2 syllables.
  
  // Let's try to find instances where a common word is a prefix of a longer string that isn't a known word.
  // Actually, a simpler way is to use a regex for common combinations.
  
  const stuckPatterns = [
    // Common stuck words (particle/verb/adverb stuck to previous word)
    { pattern: /([a-z\u00C0-\u1EF9])(là|không|có|cũng|theo|tại|khỏi|rất|như|thế|cái|mấy|với|mà|của|được|những|một|đã|đang|sẽ|rời|định|tinh|cảnh|mặc|nghĩ|nhận|thần|coi|gầy|tiếp|vừa|vẫn|còn|nữa)/g, replacement: "$1 $2" },
    // Specific cases from user
    { pattern: /(Trụ)(không|có|Tòng|Tòng)/g, replacement: "$1 $2" },
    { pattern: /(thể)(gầy|tiếp)/g, replacement: "$1 $2" },
    { pattern: /(xóm)(coi)/g, replacement: "$1 $2" },
    { pattern: /(tộc)(Mộc|sự)/g, replacement: "$1 $2" },
    { pattern: /(Tộc)(cũng)/g, replacement: "$1 $2" },
    { pattern: /(quản)(gia)/g, replacement: "$1 $2" },
    { pattern: /(thành)(định)/g, replacement: "$1 $2" },
    { pattern: /(Hậu)(rời)/g, replacement: "$1 $2" },
  ];

  stuckPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  // Handle lowercase followed by Uppercase (e.g. làTòng -> là Tòng)
  cleaned = cleaned.replace(/([a-z\u00C0-\u1EF9])([A-Z\u00C0-\u1EF9])/g, "$1 $2");

  return cleaned;
}
