"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Character } from "@/lib/db";

export function useCharacters(novelId: string | undefined) {
  const characters = useLiveQuery(
    () =>
      novelId
        ? db.characters.where("novelId").equals(novelId).toArray()
        : [],
    [novelId]
  );
  return characters;
}

export function useCharacter(id: string | undefined) {
  const character = useLiveQuery(
    () => (id ? db.characters.get(id) : undefined),
    [id]
  );
  return character;
}

export async function createCharacter(
  data: Omit<Character, "id" | "createdAt" | "updatedAt">
) {
  const now = new Date();
  const id = crypto.randomUUID();
  await db.characters.add({ ...data, id, createdAt: now, updatedAt: now });
  return id;
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, "id" | "createdAt">>
) {
  await db.characters.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteCharacter(id: string) {
  await db.characters.delete(id);
}
