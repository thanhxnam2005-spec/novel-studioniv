"use client";

import { GlobalInstructionSettings } from "@/components/global-instruction-settings";

export default function InstructionsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Global Instruction
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a system instruction that applies to every AI request.
        </p>
      </div>
      <GlobalInstructionSettings />
    </main>
  );
}
