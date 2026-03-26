import type { NovelStudioDB } from "./db";

/**
 * Register all Dexie schema versions.
 * Called once from the NovelStudioDB constructor.
 *
 * IMPORTANT: This is a fresh v1 schema. Users must clear their IndexedDB
 * (`novel-studio` database) and re-import data after this reset.
 */
export function registerMigrations(db: NovelStudioDB) {
  db.version(1).stores({
    novels: "id, title, genre, createdAt, updatedAt",
    chapters: "id, novelId, order, createdAt, updatedAt",
    scenes:
      "id, chapterId, novelId, order, isActive, activeSceneId, [chapterId+isActive], [novelId+isActive], [activeSceneId+version]",
    characters: "id, novelId, name, role",
    notes: "id, novelId, category, createdAt",
    aiProviders: "id, name, isActive, createdAt, updatedAt",
    aiModels: "id, providerId, modelId, createdAt",
    conversations: "id, providerId, modelId, createdAt, updatedAt",
    conversationMessages: "id, conversationId, createdAt",
    chatSettings: "id",
    analysisSettings: "id",
  });
}
