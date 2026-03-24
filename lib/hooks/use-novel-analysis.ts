"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type NovelAnalysis } from "@/lib/db";

export function useNovelAnalysis(novelId: string | undefined) {
  const analysis = useLiveQuery(
    () =>
      novelId
        ? db.novelAnalyses
            .where("novelId")
            .equals(novelId)
            .first()
            .then((r) => r ?? null)
        : null,
    [novelId],
  );
  return analysis;
}

export async function createNovelAnalysis(
  data: Omit<NovelAnalysis, "id" | "createdAt" | "updatedAt">,
) {
  const now = new Date();
  const id = crypto.randomUUID();
  await db.novelAnalyses.add({ ...data, id, createdAt: now, updatedAt: now });
  return id;
}

export async function updateNovelAnalysis(
  id: string,
  data: Partial<Omit<NovelAnalysis, "id" | "createdAt">>,
) {
  await db.novelAnalyses.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteNovelAnalysis(id: string) {
  await db.novelAnalyses.delete(id);
}
