"use client";

import { NovelImportWizard } from "@/components/novel-import-wizard";

export default function ImportPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Import Novel
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload or paste novel text and split it into chapters.
        </p>
      </div>
      <NovelImportWizard />
    </main>
  );
}
