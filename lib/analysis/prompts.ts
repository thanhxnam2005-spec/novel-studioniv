// ─── Custom Prompts Interface ───────────────────────────────

export interface CustomPrompts {
  chapterAnalysis?: string;
  novelAggregation?: string;
  characterProfiling?: string;
}

// ─── Default System Prompts ─────────────────────────────────

export const DEFAULT_CHAPTER_ANALYSIS_SYSTEM = `Bạn là nhà phân tích văn học. Phân tích chương được cho của một tiểu thuyết.
Trích xuất:
1. Tóm tắt ngắn gọn (2-4 câu)
2. Các cảnh hoặc sự kiện chính xảy ra
3. Tất cả nhân vật xuất hiện hoặc được đề cập, ghi chú vai trò và hành động của họ

Phân tích kỹ lưỡng nhưng ngắn gọn. Tập trung vào chi tiết liên quan đến cốt truyện. Trả lời bằng Tiếng Việt.`;

export const DEFAULT_NOVEL_AGGREGATION_SYSTEM = `Bạn là nhà phân tích văn học. Dựa trên tóm tắt từng chương của một tiểu thuyết, hãy cung cấp phân tích toàn diện.
Trích xuất:
1. Thể loại và nhãn mô tả tốt nhất tiểu thuyết này
2. Tóm tắt hấp dẫn (3-6 câu) nắm bắt tinh thần câu chuyện
3. Các yếu tố xây dựng thế giới: tổng quan thế giới, hệ thống sức mạnh/phép thuật, bối cảnh, thời kỳ, phe phái, địa điểm quan trọng, quy luật thế giới, trình độ công nghệ

Với thể loại, sử dụng tên thể loại văn học tiêu chuẩn (Huyền huyễn, Ngôn tình, Khoa học viễn tưởng, Trinh thám, v.v.)
Với nhãn, sử dụng nhãn mô tả cộng đồng (slow-burn, isekai, tu tiên, nhân vật chính mạnh mẽ, v.v.)
Đặt giá trị null cho các trường không áp dụng (VD: hệ thống sức mạnh cho tiểu thuyết hiện thực). Trả lời bằng Tiếng Việt.`;

export const DEFAULT_CHARACTER_PROFILING_SYSTEM = `Bạn là nhà phân tích văn học chuyên về phân tích nhân vật. Dựa trên thông tin về nhân vật thu thập từ các chương của tiểu thuyết, hãy tạo hồ sơ nhân vật chi tiết.

Với mỗi nhân vật, cung cấp:
- Thông tin cơ bản: tên, tuổi, giới tính, vai trò trong truyện
- Ngoại hình và tính cách
- Sở thích
- Mối quan hệ: với nhân vật chính và với các nhân vật khác
- Hành trình và phát triển nhân vật
- Điểm mạnh, điểm yếu, động lực và mục tiêu

Gộp các tham chiếu trùng lặp (VD: cùng một nhân vật được gọi bằng nhiều tên hoặc danh xưng khác nhau).
Chỉ bao gồm nhân vật có sự hiện diện có ý nghĩa — bỏ qua nhân vật phụ không tên xuất hiện một lần.
Với trường "relationshipWithMC" của nhân vật chính, ghi "N/A - đây là nhân vật chính". Trả lời bằng Tiếng Việt.`;

// ─── Resolved Prompts (with custom overrides) ───────────────

export function resolvePrompts(custom?: CustomPrompts) {
  return {
    chapterAnalysis:
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    batchChapterAnalysis: buildBatchSystemPrompt(
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    ),
    intermediateAggregation: `Bạn là nhà phân tích văn học. Tóm tắt nhóm tóm tắt chương sau thành một bản tóm tắt mạch lạc, giữ lại tất cả điểm nút cốt truyện, giới thiệu nhân vật và chi tiết xây dựng thế giới quan. Bản tóm tắt trung gian này sẽ được sử dụng trong bước tổng hợp sau, vì vậy hãy giữ lại các chi tiết quan trọng. Trả lời bằng Tiếng Việt.`,
    novelAggregation:
      custom?.novelAggregation?.trim() || DEFAULT_NOVEL_AGGREGATION_SYSTEM,
    characterProfiling:
      custom?.characterProfiling?.trim() ||
      DEFAULT_CHARACTER_PROFILING_SYSTEM,
  };
}

/**
 * Derive the batch system prompt from the single-chapter system prompt.
 * Wraps it with batch instructions.
 */
function buildBatchSystemPrompt(chapterPrompt: string): string {
  return `Bạn sẽ nhận được nhiều chương từ một tiểu thuyết. Phân tích từng chương và trả về mảng kết quả theo cùng thứ tự.

Với mỗi chương, làm theo chỉ thị sau:
${chapterPrompt}`;
}

// ─── User Prompt Builders ───────────────────────────────────

export function buildChapterPrompt(
  chapterTitle: string,
  chapterContent: string,
): string {
  return `## ${chapterTitle}\n\n${chapterContent}`;
}

export function buildBatchChapterPrompt(
  chapters: { title: string; content: string }[],
): string {
  return chapters
    .map((ch, i) => `## Chương ${i + 1}: ${ch.title}\n\n${ch.content}`)
    .join("\n\n---\n\n");
}

export function buildIntermediateAggregationPrompt(
  summaries: { title: string; summary: string }[],
): string {
  const text = summaries
    .map((s) => `### ${s.title}\n${s.summary}`)
    .join("\n\n");
  return `Tóm tắt các bản tóm tắt chương sau thành một bản tóm tắt trung gian mạch lạc:\n\n${text}`;
}

export function buildAggregationPrompt(
  chapterSummaries: { title: string; summary: string }[],
): string {
  const summariesText = chapterSummaries
    .map((ch, i) => `### Chương ${i + 1}: ${ch.title}\n${ch.summary}`)
    .join("\n\n");

  return `# Phân tích tiểu thuyết — Tóm tắt các chương\n\nSau đây là tóm tắt của từng chương:\n\n${summariesText}\n\nDựa trên các tóm tắt này, hãy cung cấp phân tích toàn diện về toàn bộ tiểu thuyết.`;
}

export function buildCharacterPrompt(
  characterNotes: { name: string; mentions: string[] }[],
): string {
  const notesText = characterNotes
    .map(
      (ch) =>
        `### ${ch.name}\n${ch.mentions.map((m) => `- ${m}`).join("\n")}`,
    )
    .join("\n\n");

  return `# Phân tích nhân vật\n\nSau đây là ghi chú về nhân vật thu thập từ tất cả các chương:\n\n${notesText}\n\nTạo hồ sơ chi tiết cho mỗi nhân vật quan trọng. Gộp các mục trùng lặp tham chiếu đến cùng một nhân vật.`;
}
