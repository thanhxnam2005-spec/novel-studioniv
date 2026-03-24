"use client";

import { GlobalInstructionSettings } from "@/components/global-instruction-settings";

export default function InstructionsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Chỉ thị chung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đặt chỉ thị hệ thống áp dụng cho mọi yêu cầu AI.
        </p>
      </div>
      <GlobalInstructionSettings />
    </main>
  );
}
