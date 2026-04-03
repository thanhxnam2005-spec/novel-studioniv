import {
  db,
  type Character,
  type CharacterRelationship,
  type NameDescription,
} from "@/lib/db";
import { tool } from "ai";
import { z } from "zod";

const MAX_CONTENT_LENGTH = 8000;

/** Resolve a chapter by UUID or by order number within a novel. */
async function resolveChapter(novelId: string, chapterRef: string) {
  // Try UUID lookup first
  const byId = await db.chapters.get(chapterRef);
  if (byId && byId.novelId === novelId) return byId;

  // Try as order number (accepts both 0-based and 1-based)
  const num = Number(chapterRef);
  if (Number.isInteger(num) && num >= 0) {
    const chapters = await db.chapters
      .where("novelId")
      .equals(novelId)
      .sortBy("order");
    // 0 → first chapter, 1 → first chapter, 2 → second, etc.
    const idx = num === 0 ? 0 : num - 1;
    return chapters[idx] ?? null;
  }

  return null;
}

function mapCharacter(c: Character) {
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    description: c.description,
    notes: c.notes,
    age: c.age,
    sex: c.sex,
    appearance: c.appearance,
    personality: c.personality,
    hobbies: c.hobbies,
    relationshipWithMC: c.relationshipWithMC,
    relationships: c.relationships,
    characterArc: c.characterArc,
    strengths: c.strengths,
    weaknesses: c.weaknesses,
    motivations: c.motivations,
    goals: c.goals,
  };
}

function mapCharacterBasic(c: Character) {
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    relationshipWithMC: c.relationshipWithMC,
  };
}

function normalizeName(value: string) {
  return value.normalize("NFC").trim().toLowerCase();
}

function updateNamedListItem(
  items: NameDescription[] | undefined,
  name: string,
  description: string,
) {
  const normalized = normalizeName(name);
  const current = items ?? [];
  const index = current.findIndex(
    (item) => normalizeName(item.name) === normalized,
  );
  if (index === -1) return { updated: false, items: current };

  const next = [...current];
  next[index] = { ...next[index], description };
  return { updated: true, items: next };
}

async function findCharacterByName(novelId: string, name: string) {
  const normalized = normalizeName(name);
  const characters = await db.characters
    .where("novelId")
    .equals(novelId)
    .toArray();
  return (
    characters.find((char) => normalizeName(char.name) === normalized) ?? null
  );
}

/**
 * Create AI tools scoped to a specific novel.
 * Includes both read and edit tools for autonomous chat workflows.
 */
export function createChatTools(novelId: string) {
  return {
    updateNovelSynopsis: tool({
      description: "Cập nhật tóm tắt tiểu thuyết.",
      inputSchema: z.object({
        synopsis: z.string().describe("Tóm tắt đã cập nhật"),
      }),
      execute: async ({ synopsis }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        await db.novels.update(novelId, { synopsis, updatedAt: new Date() });
        return { ok: true, synopsis };
      },
    }),

    updateGenresTags: tool({
      description: "Cập nhật thể loại và nhãn của tiểu thuyết.",
      inputSchema: z.object({
        genres: z.array(z.string()).describe("Danh sách thể loại đã cập nhật"),
        tags: z.array(z.string()).describe("Danh sách nhãn đã cập nhật"),
      }),
      execute: async ({ genres, tags }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        await db.novels.update(novelId, {
          genres,
          tags,
          updatedAt: new Date(),
        });
        return { ok: true, genresCount: genres.length, tagsCount: tags.length };
      },
    }),

    updateWorldBuilding: tool({
      description:
        "Cập nhật các trường xây dựng thế giới, chỉ gửi các trường cần đổi.",
      inputSchema: z.object({
        worldOverview: z.string().optional(),
        powerSystem: z.string().nullable().optional(),
        storySetting: z.string().optional(),
        timePeriod: z.string().nullable().optional(),
        worldRules: z.string().nullable().optional(),
        technologyLevel: z.string().nullable().optional(),
      }),
      execute: async (input) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const hasChanges = Object.keys(input).length > 0;
        if (!hasChanges)
          return { ok: false, message: "Không có trường nào để cập nhật" };
        const payload: Partial<{
          worldOverview: string;
          powerSystem: string;
          storySetting: string;
          timePeriod: string;
          worldRules: string;
          technologyLevel: string;
        }> = {};
        if (input.worldOverview !== undefined)
          payload.worldOverview = input.worldOverview;
        if (input.powerSystem !== undefined)
          payload.powerSystem = input.powerSystem ?? "";
        if (input.storySetting !== undefined)
          payload.storySetting = input.storySetting;
        if (input.timePeriod !== undefined)
          payload.timePeriod = input.timePeriod ?? "";
        if (input.worldRules !== undefined)
          payload.worldRules = input.worldRules ?? "";
        if (input.technologyLevel !== undefined) {
          payload.technologyLevel = input.technologyLevel ?? "";
        }

        await db.novels.update(novelId, { ...payload, updatedAt: new Date() });
        return { ok: true, updatedFields: Object.keys(payload) };
      },
    }),

    addFaction: tool({
      description: "Thêm một phe phái/tổ chức mới vào tiểu thuyết.",
      inputSchema: z.object({
        name: z.string(),
        description: z.string(),
      }),
      execute: async ({ name, description }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const factions = novel.factions ?? [];
        const exists = factions.some(
          (item) => normalizeName(item.name) === normalizeName(name),
        );
        if (exists) return { ok: false, message: "Phe phái đã tồn tại" };

        const next = [...factions, { name, description }];
        await db.novels.update(novelId, {
          factions: next,
          updatedAt: new Date(),
        });
        return { ok: true, faction: { name, description } };
      },
    }),

    updateFaction: tool({
      description: "Cập nhật mô tả của phe phái hiện có theo tên.",
      inputSchema: z.object({
        name: z.string().describe("Tên chính xác hoặc gần đúng của phe phái"),
        description: z.string().describe("Mô tả đã cập nhật"),
      }),
      execute: async ({ name, description }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const { updated, items } = updateNamedListItem(
          novel.factions,
          name,
          description,
        );
        if (!updated)
          return { ok: false, message: "Không tìm thấy phe phái để cập nhật" };

        await db.novels.update(novelId, {
          factions: items,
          updatedAt: new Date(),
        });
        return { ok: true, name, description };
      },
    }),

    addLocation: tool({
      description: "Thêm một địa điểm quan trọng mới.",
      inputSchema: z.object({
        name: z.string(),
        description: z.string(),
      }),
      execute: async ({ name, description }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const keyLocations = novel.keyLocations ?? [];
        const exists = keyLocations.some(
          (item) => normalizeName(item.name) === normalizeName(name),
        );
        if (exists) return { ok: false, message: "Địa điểm đã tồn tại" };

        const next = [...keyLocations, { name, description }];
        await db.novels.update(novelId, {
          keyLocations: next,
          updatedAt: new Date(),
        });
        return { ok: true, location: { name, description } };
      },
    }),

    updateLocation: tool({
      description: "Cập nhật mô tả của địa điểm hiện có theo tên.",
      inputSchema: z.object({
        name: z.string().describe("Tên chính xác hoặc gần đúng của địa điểm"),
        description: z.string().describe("Mô tả đã cập nhật"),
      }),
      execute: async ({ name, description }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const { updated, items } = updateNamedListItem(
          novel.keyLocations,
          name,
          description,
        );
        if (!updated)
          return { ok: false, message: "Không tìm thấy địa điểm để cập nhật" };

        await db.novels.update(novelId, {
          keyLocations: items,
          updatedAt: new Date(),
        });
        return { ok: true, name, description };
      },
    }),

    addCharacter: tool({
      description: "Thêm nhân vật mới vào hồ sơ nhân vật của tiểu thuyết.",
      inputSchema: z.object({
        name: z.string(),
        role: z.string(),
        description: z.string(),
        age: z.string().optional(),
        sex: z.string().optional(),
        appearance: z.string().optional(),
        personality: z.string().optional(),
        hobbies: z.string().optional(),
        relationshipWithMC: z.string().optional(),
        relationships: z
          .array(
            z.object({ characterName: z.string(), description: z.string() }),
          )
          .optional(),
        characterArc: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        motivations: z.string().optional(),
        goals: z.string().optional(),
      }),
      execute: async (input) => {
        const existing = await findCharacterByName(novelId, input.name);
        if (existing) return { ok: false, message: "Nhân vật đã tồn tại" };

        const now = new Date();
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `char_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

        await db.characters.add({
          id,
          novelId,
          name: input.name,
          role: input.role,
          description: input.description,
          age: input.age,
          sex: input.sex,
          appearance: input.appearance,
          personality: input.personality,
          hobbies: input.hobbies,
          relationshipWithMC: input.relationshipWithMC,
          relationships: input.relationships,
          characterArc: input.characterArc,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          motivations: input.motivations,
          goals: input.goals,
          createdAt: now,
          updatedAt: now,
        });

        return { ok: true, characterId: id, name: input.name };
      },
    }),

    updateCharacter: tool({
      description:
        "Cập nhật nhân vật hiện có theo tên. Chỉ gửi các trường cần đổi.",
      inputSchema: z.object({
        name: z.string().describe("Tên nhân vật cần cập nhật"),
        role: z.string().optional(),
        description: z.string().optional(),
        age: z.string().optional(),
        sex: z.string().optional(),
        appearance: z.string().optional(),
        personality: z.string().optional(),
        hobbies: z.string().optional(),
        relationshipWithMC: z.string().optional(),
        characterArc: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        motivations: z.string().optional(),
        goals: z.string().optional(),
      }),
      execute: async ({ name, ...updates }) => {
        const character = await findCharacterByName(novelId, name);
        if (!character) return { error: "Không tìm thấy nhân vật" };

        const hasChanges = Object.keys(updates).length > 0;
        if (!hasChanges)
          return { ok: false, message: "Không có trường nào để cập nhật" };

        await db.characters.update(character.id, {
          ...updates,
          updatedAt: new Date(),
        });

        return {
          ok: true,
          characterId: character.id,
          updatedFields: Object.keys(updates),
        };
      },
    }),

    addRelationship: tool({
      description: "Thêm mối quan hệ cho một nhân vật hiện có.",
      inputSchema: z.object({
        characterName: z.string().describe("Tên nhân vật cần thêm quan hệ"),
        relatedTo: z.string().describe("Tên nhân vật liên quan"),
        description: z.string().describe("Mô tả mối quan hệ"),
      }),
      execute: async ({ characterName, relatedTo, description }) => {
        const character = await findCharacterByName(novelId, characterName);
        if (!character) return { error: "Không tìm thấy nhân vật" };

        const relationships: CharacterRelationship[] =
          character.relationships ?? [];
        const exists = relationships.some(
          (item) =>
            normalizeName(item.characterName) === normalizeName(relatedTo) &&
            normalizeName(item.description) === normalizeName(description),
        );
        if (exists) return { ok: false, message: "Mối quan hệ đã tồn tại" };

        const next = [
          ...relationships,
          { characterName: relatedTo, description },
        ];
        await db.characters.update(character.id, {
          relationships: next,
          updatedAt: new Date(),
        });

        return { ok: true, characterId: character.id, relatedTo };
      },
    }),

    getNovelOverview: tool({
      description:
        "Lấy thông tin tổng quan tiểu thuyết: metadata, thể loại, nhãn, xây dựng thế giới, hệ thống sức mạnh, bối cảnh, phe phái, địa danh.",
      inputSchema: z.object({}),
      execute: async () => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };
        return {
          title: novel.title,
          description: novel.description,
          author: novel.author,
          synopsis: novel.synopsis,
          genres: novel.genres,
          tags: novel.tags,
          worldOverview: novel.worldOverview,
          powerSystem: novel.powerSystem,
          storySetting: novel.storySetting,
          timePeriod: novel.timePeriod,
          factions: novel.factions,
          keyLocations: novel.keyLocations,
          worldRules: novel.worldRules,
          technologyLevel: novel.technologyLevel,
        };
      },
    }),

    getWorldBuilding: tool({
      description:
        "Tra cứu chi tiết xây dựng thế giới: phe phái (tên + mô tả), địa danh (tên + mô tả), hệ thống sức mạnh, bối cảnh, quy luật thế giới, trình độ công nghệ, thời kỳ. Có thể lọc theo loại cụ thể.",
      inputSchema: z.object({
        category: z
          .enum([
            "all",
            "factions",
            "locations",
            "powerSystem",
            "storySetting",
            "worldRules",
            "technologyLevel",
            "timePeriod",
          ])
          .optional()
          .describe(
            "Loại thông tin cần lấy (mặc định: all). factions = phe phái, locations = địa danh, powerSystem = hệ thống sức mạnh, storySetting = bối cảnh, worldRules = quy luật, technologyLevel = công nghệ, timePeriod = thời kỳ",
          ),
        search: z
          .string()
          .optional()
          .describe(
            "Từ khóa tìm kiếm trong phe phái/địa danh (lọc theo tên hoặc mô tả)",
          ),
      }),
      execute: async ({ category = "all", search }) => {
        const novel = await db.novels.get(novelId);
        if (!novel) return { error: "Không tìm thấy tiểu thuyết" };

        const filterItems = (
          items: { name: string; description: string }[] | undefined,
        ) => {
          if (!items) return [];
          if (!search) return items;
          const q = search.normalize("NFC").toLowerCase();
          return items.filter(
            (item) =>
              item.name.normalize("NFC").toLowerCase().includes(q) ||
              item.description.normalize("NFC").toLowerCase().includes(q),
          );
        };

        if (category === "all") {
          return {
            worldOverview: novel.worldOverview,
            powerSystem: novel.powerSystem,
            storySetting: novel.storySetting,
            timePeriod: novel.timePeriod,
            worldRules: novel.worldRules,
            technologyLevel: novel.technologyLevel,
            factions: filterItems(novel.factions),
            keyLocations: filterItems(novel.keyLocations),
          };
        }

        switch (category) {
          case "factions":
            return { factions: filterItems(novel.factions) };
          case "locations":
            return { keyLocations: filterItems(novel.keyLocations) };
          case "powerSystem":
            return { powerSystem: novel.powerSystem };
          case "storySetting":
            return { storySetting: novel.storySetting };
          case "worldRules":
            return { worldRules: novel.worldRules };
          case "technologyLevel":
            return { technologyLevel: novel.technologyLevel };
          case "timePeriod":
            return { timePeriod: novel.timePeriod };
        }
      },
    }),

    getChapterDetails: tool({
      description:
        'Lấy chi tiết chương: tiêu đề, tóm tắt, danh sách scene (tiêu đề và số từ). Có thể truyền số thứ tự chương (vd: "1", "2") hoặc UUID. Bỏ qua để lấy danh sách tất cả chương.',
      inputSchema: z.object({
        chapter: z
          .string()
          .optional()
          .describe(
            'Số thứ tự chương (vd: "1") hoặc UUID (bỏ qua để lấy tất cả)',
          ),
      }),
      execute: async ({ chapter: chapterRef }) => {
        if (chapterRef) {
          const chapter = await resolveChapter(novelId, chapterRef);
          if (!chapter) return { error: "Không tìm thấy chương" };

          const scenes = await db.scenes
            .where("[chapterId+isActive]")
            .equals([chapter.id, 1])
            .sortBy("order");

          return {
            chapterNumber: chapter.order,
            title: chapter.title,
            summary: chapter.summary,
            scenes: scenes.map((s) => ({
              title: s.title,
              wordCount: s.wordCount,
            })),
          };
        }

        const chapters = await db.chapters
          .where("novelId")
          .equals(novelId)
          .sortBy("order");

        return {
          chapters: chapters.map((c) => ({
            chapterNumber: c.order,
            title: c.title,
            summary: c.summary,
          })),
        };
      },
    }),

    getChapterContent: tool({
      description:
        'Lấy nội dung văn bản đầy đủ của các scene trong một chương. Có thể truyền số thứ tự chương (vd: "1") hoặc UUID.',
      inputSchema: z.object({
        chapter: z.string().describe('Số thứ tự chương (vd: "1") hoặc UUID'),
      }),
      execute: async ({ chapter: chapterRef }) => {
        const chapter = await resolveChapter(novelId, chapterRef);
        if (!chapter) return { error: "Không tìm thấy chương" };

        const scenes = await db.scenes
          .where("[chapterId+isActive]")
          .equals([chapter.id, 1])
          .sortBy("order");

        let totalLength = 0;
        const result: { title: string; content: string }[] = [];

        for (const scene of scenes) {
          const remaining = MAX_CONTENT_LENGTH - totalLength;
          if (remaining <= 0) {
            result.push({
              title: scene.title,
              content: "[Đã bỏ qua do vượt giới hạn ký tự]",
            });
            continue;
          }
          const content =
            scene.content.length > remaining
              ? scene.content.slice(0, remaining) + "\n...[đã cắt bớt]"
              : scene.content;
          totalLength += content.length;
          result.push({ title: scene.title, content });
        }

        return {
          chapterTitle: chapter.title,
          scenes: result,
        };
      },
    }),

    getCharacters: tool({
      description:
        "Lấy thông tin nhân vật. Nếu truyền characterId thì trả về đầy đủ trường của nhân vật đó và các chapter có mặt. Nếu không truyền thì trả về danh sách cơ bản (id, tên, vai trò, relationshipWithMC) của tất cả nhân vật.",
      inputSchema: z.object({
        characterId: z
          .string()
          .optional()
          .describe("ID nhân vật cụ thể (bỏ qua để lấy tất cả)"),
      }),
      execute: async ({ characterId }) => {
        if (characterId) {
          const char = await db.characters.get(characterId);
          if (!char || char.novelId !== novelId)
            return { error: "Không tìm thấy nhân vật" };
          const chapters = await db.chapters
            .where("novelId")
            .equals(novelId)
            .sortBy("order");
          const appearsInChapters = chapters
            .filter((chapter) => (chapter.characterIds ?? []).includes(char.id))
            .map((chapter) => ({
              id: chapter.id,
              order: chapter.order,
              title: chapter.title,
              summary: chapter.summary,
            }));

          return {
            ...mapCharacter(char),
            chapters: appearsInChapters,
          };
        }

        const characters = await db.characters
          .where("novelId")
          .equals(novelId)
          .toArray();

        return { characters: characters.map(mapCharacterBasic) };
      },
    }),

    getNovelNotes: tool({
      description:
        "Lấy ghi chú của người dùng về tiểu thuyết (tài liệu tham khảo, ý tưởng, ghi chú cá nhân).",
      inputSchema: z.object({}),
      execute: async () => {
        const notes = await db.notes.where("novelId").equals(novelId).toArray();

        return {
          notes: notes.map((n) => ({
            id: n.id,
            title: n.title,
            category: n.category,
            content: n.content,
          })),
        };
      },
    }),

    searchNovelContent: tool({
      description:
        "Tìm kiếm toàn văn (fuzzy) trong nội dung tiểu thuyết: scene, chương, nhân vật, ghi chú, thông tin novel. Hỗ trợ lọc theo một hoặc nhiều type và tìm gần đúng (typo, dấu).",
      inputSchema: z.object({
        query: z.string().describe("Từ khóa hoặc cụm từ cần tìm"),
        limit: z
          .number()
          .optional()
          .describe("Số lượng kết quả tối đa, mặc định 5"),
        types: z
          .union([
            z.enum(["novel", "chapter", "character", "note", "scene"]),
            z.array(z.enum(["novel", "chapter", "character", "note", "scene"])),
          ])
          .optional()
          .describe(
            'Lọc theo một hoặc nhiều loại kết quả. Ví dụ: "chapter" hoặc ["character", "note"]',
          ),
      }),
      execute: async ({ query, limit = 5, types }) => {
        const { globalSearch } = await import("@/lib/search/global-search");
        const defaultSearchTypes = [
          "novel",
          "chapter",
          "character",
          "note",
          "scene",
        ] as const;
        const searchTypes: (typeof defaultSearchTypes)[number][] = types
          ? Array.isArray(types)
            ? types
            : [types]
          : [...defaultSearchTypes];
        const hits = await globalSearch(query, {
          novelId,
          limit,
          types: searchTypes,
        });

        return {
          query,
          totalResults: hits.length,
          results: hits.map((h) => ({
            type: h.type,
            location: h.subtitle,
            title: h.title,
            score: h.score,
          })),
        };
      },
    }),
  };
}
