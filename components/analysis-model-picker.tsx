"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  useAnalysisSettings,
  updateAnalysisSettings,
  useAIProviders,
  useAIModels,
} from "@/lib/hooks";
import type { StepModelConfig } from "@/lib/db";

interface StepConfig {
  key: "chapterModel" | "aggregationModel" | "characterModel";
  label: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    key: "chapterModel",
    label: "Chapter Analysis",
    description: "Analyzes each chapter for summary, scenes, and characters",
  },
  {
    key: "aggregationModel",
    label: "Novel Overview",
    description: "Extracts genres, tags, synopsis, and world-building",
  },
  {
    key: "characterModel",
    label: "Character Profiling",
    description: "Builds detailed character profiles from cross-chapter data",
  },
];

function StepModelSelector({
  step,
  value,
  onChange,
}: {
  step: StepConfig;
  value: StepModelConfig | undefined;
  onChange: (value: StepModelConfig | undefined) => void;
}) {
  const providers = useAIProviders();
  const selectedProviderId = value?.providerId ?? "";
  const models = useAIModels(selectedProviderId || undefined);

  const handleProviderChange = (providerId: string) => {
    if (!providerId) {
      onChange(undefined);
      return;
    }
    onChange({ providerId, modelId: "" });
  };

  const handleModelChange = (modelId: string) => {
    if (!selectedProviderId) return;
    onChange({ providerId: selectedProviderId, modelId });
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{step.label}</p>
          <p className="text-xs text-muted-foreground">{step.description}</p>
        </div>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            className="h-7 text-xs"
          >
            <RotateCcwIcon className="mr-1 size-3" />
            Default
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Provider</Label>
          <NativeSelect
            className="mt-1 w-full"
            value={selectedProviderId}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <NativeSelectOption value="">Use default</NativeSelectOption>
            {providers?.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label className="text-xs">Model</Label>
          <NativeSelect
            className="mt-1 w-full"
            value={value?.modelId ?? ""}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!selectedProviderId}
          >
            <NativeSelectOption value="">
              {selectedProviderId ? "Select model" : "Select provider first"}
            </NativeSelectOption>
            {models?.map((m) => (
              <NativeSelectOption key={m.id} value={m.modelId}>
                {m.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  );
}

export function AnalysisModelPicker() {
  const settings = useAnalysisSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, StepModelConfig | undefined>
  >({});
  const [saving, setSaving] = useState(false);

  const getValue = (step: StepConfig): StepModelConfig | undefined =>
    step.key in drafts ? drafts[step.key] : settings[step.key];

  const handleChange = (
    step: StepConfig,
    value: StepModelConfig | undefined,
  ) => {
    setDrafts((prev) => ({ ...prev, [step.key]: value }));
  };

  const hasAnyDraft = STEPS.some((s) => s.key in drafts);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, StepModelConfig | undefined> = {};
      for (const step of STEPS) {
        if (step.key in drafts) {
          updates[step.key] = drafts[step.key];
        }
      }
      await updateAnalysisSettings(updates);
      setDrafts({});
      toast.success("Model settings saved");
    } catch {
      toast.error("Failed to save model settings");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyCustom = STEPS.some((s) => settings[s.key]);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
          <div>
            <CardTitle className="text-base">
              Per-Step Models
              {hasAnyCustom && !isOpen && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (customized)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Use different providers or models for each analysis step
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 pt-0">
          {STEPS.map((step) => (
            <StepModelSelector
              key={step.key}
              step={step}
              value={getValue(step)}
              onChange={(v) => handleChange(step, v)}
            />
          ))}

          {hasAnyDraft && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            When set to &ldquo;Use default&rdquo;, inherits from your global
            chat settings provider and model.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
