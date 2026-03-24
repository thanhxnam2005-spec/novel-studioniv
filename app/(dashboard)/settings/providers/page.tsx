"use client";

import { AIProviderSettings } from "@/components/ai-provider-settings";

export default function ProvidersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Nhà cung cấp AI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cấu hình nền tảng AI cho trò chuyện và phân tích.
        </p>
      </div>
      <AIProviderSettings />
    </main>
  );
}
