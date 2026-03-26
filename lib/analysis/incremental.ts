import { db, type Chapter } from "@/lib/db";

/**
 * Determine which chapters need (re-)analysis.
 *
 * A chapter needs analysis if:
 * - It has never been analyzed (no `analyzedAt`)
 * - Any of its scenes has been modified after `analyzedAt`
 */
export async function getChaptersNeedingAnalysis(novelId: string): Promise<{
  needsAnalysis: Chapter[];
  upToDate: Chapter[];
}> {
  const chapters = await db.chapters
    .where("novelId")
    .equals(novelId)
    .sortBy("order");

  const needsAnalysis: Chapter[] = [];
  const upToDate: Chapter[] = [];

  for (const ch of chapters) {
    if (!ch.analyzedAt) {
      needsAnalysis.push(ch);
      continue;
    }

    const scenes = await db.scenes
      .where("[chapterId+isActive]")
      .equals([ch.id, 1])
      .toArray();
    const latestEdit = Math.max(
      ...scenes.map((s) => s.updatedAt.getTime()),
      0,
    );

    if (latestEdit > ch.analyzedAt.getTime()) {
      needsAnalysis.push(ch);
    } else {
      upToDate.push(ch);
    }
  }

  return { needsAnalysis, upToDate };
}
