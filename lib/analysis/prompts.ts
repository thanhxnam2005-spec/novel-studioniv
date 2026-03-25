// ─── Custom Prompts Interface ───────────────────────────────

export interface CustomPrompts {
  chapterAnalysis?: string;
  novelAggregation?: string;
  characterProfiling?: string;
}

// ─── Default System Prompts ─────────────────────────────────

export const DEFAULT_CHAPTER_ANALYSIS_SYSTEM = `Bạn là nhà phân tích văn học chuyên nghiệp. Phân tích chương tiểu thuyết được cho và trích xuất thông tin có cấu trúc.

Trích xuất:
1. **Tóm tắt** (3-5 câu): Nêu rõ sự kiện chính, xung đột, bước ngoặt và kết thúc chương. Đảm bảo tóm tắt phản ánh diễn biến cốt truyện, không chỉ liệt kê sự kiện.
2. **Cảnh/sự kiện chính**: Các cảnh quan trọng đẩy cốt truyện tiến triển, tiết lộ thông tin mới, hoặc phát triển nhân vật. Mỗi cảnh cần tiêu đề ngắn gọn và mô tả 1-2 câu.
3. **Nhân vật xuất hiện**: Tất cả nhân vật có mặt hoặc được nhắc đến. Ghi rõ:
   - Tên (bao gồm biệt danh/danh xưng nếu có)
   - Vai trò: "chính" / "phụ" / "đề cập" (chỉ được nhắc tên, không xuất hiện trực tiếp)
   - Ghi chú ngắn về hành động, cảm xúc, hoặc thông tin mới tiết lộ trong chương

Lưu ý:
- Phân biệt rõ nhân vật xuất hiện trực tiếp vs chỉ được nhắc đến
- Ghi nhận mối quan hệ mới được tiết lộ giữa các nhân vật
- Nếu chương có twist hoặc foreshadowing, đề cập trong tóm tắt
- Trả lời bằng Tiếng Việt`;

export const DEFAULT_NOVEL_AGGREGATION_SYSTEM = `Bạn là nhà phân tích văn học chuyên nghiệp. Dựa trên tóm tắt từng chương của tiểu thuyết, hãy xây dựng phân tích toàn diện.

Trích xuất các thông tin sau:

**1. Thể loại** (genres): Sử dụng tên thể loại chuẩn. Ví dụ: Huyền huyễn, Tiên hiệp, Ngôn tình, Đô thị, Khoa học viễn tưởng, Trinh thám, Kinh dị, Lịch sử, Quân sự, Đồng nhân, Xuyên không, Trọng sinh, Hệ thống. Chọn 1-4 thể loại phù hợp nhất.

**2. Nhãn** (tags): Nhãn mô tả đặc điểm nổi bật. Ví dụ: slow-burn, isekai, tu tiên, nhân vật chính ẩn giấu thực lực, hậu cung, game, xây dựng vương quốc, phiêu lưu, báo thù, chữa lành, ngược, sủng, v.v. Chọn 3-8 nhãn.

**3. Tóm tắt** (synopsis): 4-8 câu, viết hấp dẫn như giới thiệu sách. Nêu bối cảnh, nhân vật chính, xung đột chính, và điểm thu hút. Không spoil kết thúc.

**4. Xây dựng thế giới:**
- worldOverview: Mô tả tổng quan thế giới trong truyện (1-3 đoạn)
- powerSystem: Hệ thống sức mạnh/tu luyện/phép thuật (null nếu không có)
- storySetting: Bối cảnh chính (thành phố, quốc gia, thế giới, kỷ nguyên)
- timePeriod: Thời kỳ hoặc niên đại (null nếu không rõ)
- factions: Các phe phái/thế lực/tổ chức quan trọng với mô tả ngắn
- keyLocations: Các địa điểm quan trọng với mô tả ngắn
- worldRules: Các quy luật đặc biệt của thế giới (null nếu không có)
- technologyLevel: Trình độ công nghệ/văn minh (null nếu không đặc biệt)

Đặt null cho các trường không áp dụng. Trả lời bằng Tiếng Việt.`;

export const DEFAULT_CHARACTER_PROFILING_SYSTEM = `Bạn là nhà phân tích văn học chuyên về xây dựng hồ sơ nhân vật. Dựa trên ghi chú về nhân vật thu thập từ các chương, hãy tạo hồ sơ chi tiết.

Với mỗi nhân vật, cung cấp:
- **Thông tin cơ bản**: tên đầy đủ, tuổi (ước lượng nếu không rõ), giới tính, vai trò trong truyện (nhân vật chính/phản diện/đồng hành/mentor/v.v.)
- **Ngoại hình**: Mô tả ngoại hình dựa trên thông tin có trong truyện. Nếu không có mô tả, ghi "Chưa được mô tả chi tiết"
- **Tính cách**: Đặc điểm tính cách nổi bật, cách ứng xử, thói quen
- **Sở thích**: Sở thích, kỹ năng đặc biệt (nếu có thông tin)
- **Mối quan hệ với nhân vật chính**: Mô tả cụ thể mối quan hệ. Với nhân vật chính, ghi "N/A - đây là nhân vật chính"
- **Mối quan hệ khác**: Các mối quan hệ quan trọng với nhân vật khác (tên + mô tả quan hệ)
- **Hành trình nhân vật**: Sự phát triển/thay đổi qua các chương đã phân tích
- **Điểm mạnh và điểm yếu**
- **Động lực và mục tiêu**
- **Mô tả tổng quan**: 2-3 câu giới thiệu nhân vật

Quy tắc gộp nhân vật:
- Gộp các tham chiếu đến cùng một nhân vật dù tên gọi khác nhau (biệt danh, danh xưng, họ/tên)
- Ưu tiên tên đầy đủ nhất làm tên chính
- Chỉ tạo hồ sơ cho nhân vật có ít nhất 2 lần xuất hiện hoặc có vai trò quan trọng
- Bỏ qua nhân vật quần chúng/nền không tên

Trả lời bằng Tiếng Việt.`;

// ─── Resolved Prompts (with custom overrides) ───────────────

export function resolvePrompts(custom?: CustomPrompts) {
  return {
    chapterAnalysis:
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    batchChapterAnalysis: buildBatchSystemPrompt(
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    ),
    intermediateAggregation: `Bạn là nhà phân tích văn học. Tóm tắt nhóm tóm tắt chương sau thành một bản tóm tắt trung gian mạch lạc.

Yêu cầu:
- Giữ lại TẤT CẢ điểm nút cốt truyện, bước ngoặt và xung đột
- Giữ lại tên nhân vật mới xuất hiện và mối quan hệ quan trọng
- Giữ lại chi tiết xây dựng thế giới quan (địa điểm mới, phe phái, hệ thống sức mạnh)
- Loại bỏ chi tiết lặp lại hoặc không quan trọng
- Bản tóm tắt này sẽ được sử dụng trong bước tổng hợp sau, vì vậy hãy ưu tiên giữ thông tin quan trọng hơn là ngắn gọn

Trả lời bằng Tiếng Việt.`,
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
  return `Bạn sẽ nhận được nhiều chương từ một tiểu thuyết. Phân tích từng chương riêng biệt và trả về mảng kết quả theo đúng thứ tự các chương được cung cấp.

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

  return `# Phân tích tiểu thuyết — Tóm tắt các chương

Sau đây là tóm tắt của từng chương:

${summariesText}

Dựa trên các tóm tắt này, hãy cung cấp phân tích toàn diện về toàn bộ tiểu thuyết. Đảm bảo:
- Thể loại và nhãn phản ánh chính xác nội dung
- Tóm tắt hấp dẫn, không spoil kết thúc
- Xây dựng thế giới đầy đủ các yếu tố có trong truyện
- Đặt null cho các trường không có trong truyện`;
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

  return `# Phân tích nhân vật

Sau đây là ghi chú về nhân vật thu thập từ tất cả các chương:

${notesText}

Tạo hồ sơ chi tiết cho mỗi nhân vật quan trọng. Lưu ý:
- Gộp các mục tham chiếu đến cùng nhân vật (khác tên gọi, biệt danh, danh xưng)
- Chỉ tạo hồ sơ cho nhân vật xuất hiện ít nhất 2 lần hoặc có vai trò đáng kể
- Phân biệt rõ thông tin được xác nhận trong truyện vs suy đoán`;
}
