"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAnalysisSettings, updateAnalysisSettings } from "@/lib/hooks";
import {
  DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
  DEFAULT_NOVEL_AGGREGATION_SYSTEM,
  DEFAULT_CHARACTER_PROFILING_SYSTEM,
} from "@/lib/analysis";

interface PromptField {
  key: "chapterAnalysisPrompt" | "novelAggregationPrompt" | "characterProfilingPrompt";
  label: string;
  description: string;
  defaultValue: string;
}

const PROMPT_FIELDS: PromptField[] = [
  {
    key: "chapterAnalysisPrompt",
    label: "Chapter Analysis",
    description:
      "System instruction for analyzing each chapter. Controls what gets extracted (summary, scenes, characters).",
    defaultValue: DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
  },
  {
    key: "novelAggregationPrompt",
    label: "Novel Overview",
    description:
      "System instruction for the overall novel analysis. Controls genre detection, synopsis writing, and world-building extraction.",
    defaultValue: DEFAULT_NOVEL_AGGREGATION_SYSTEM,
  },
  {
    key: "characterProfilingPrompt",
    label: "Character Profiling",
    description:
      "System instruction for building character profiles from cross-chapter data.",
    defaultValue: DEFAULT_CHARACTER_PROFILING_SYSTEM,
  },
];

export function AnalysisPromptEditor() {
  const settings = useAnalysisSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getValue = (field: PromptField) =>
    drafts[field.key] ??
    settings[field.key] ??
    "";

  const getPlaceholder = (field: PromptField) => field.defaultValue;

  const isModified = (field: PromptField) => {
    const draft = drafts[field.key];
    if (draft !== undefined) {
      // Has unsaved draft — compare to stored value
      return draft !== (settings[field.key] ?? "");
    }
    return false;
  };

  const isCustomized = (field: PromptField) => {
    const stored = settings[field.key];
    return !!stored && stored.trim() !== "";
  };

  const handleChange = (field: PromptField, value: string) => {
    setDrafts((prev) => ({ ...prev, [field.key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, string | undefined> = {};
      for (const field of PROMPT_FIELDS) {
        const draft = drafts[field.key];
        if (draft !== undefined) {
          // Empty string means "use default" — store undefined
          updates[field.key] = draft.trim() || undefined;
        }
      }
      await updateAnalysisSettings(updates);
      setDrafts({});
      toast.success("Prompts saved");
    } catch {
      toast.error("Failed to save prompts");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (field: PromptField) => {
    await updateAnalysisSettings({ [field.key]: undefined });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[field.key];
      return next;
    });
    toast.success(`${field.label} prompt reset to default`);
  };

  const hasAnyDraft = PROMPT_FIELDS.some((f) => isModified(f));

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
            <CardTitle className="text-base">Custom Prompts</CardTitle>
            <CardDescription>
              Customize system instructions for each analysis step
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-5 pt-0">
          {PROMPT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{field.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {field.description}
                  </p>
                </div>
                {isCustomized(field) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset(field)}
                    className="h-7 text-xs"
                  >
                    <RotateCcwIcon className="mr-1 size-3" />
                    Reset
                  </Button>
                )}
              </div>
              <Textarea
                value={getValue(field)}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={getPlaceholder(field)}
                className="min-h-[120px] font-mono text-xs leading-relaxed"
              />
            </div>
          ))}

          {hasAnyDraft && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Prompts"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Leave empty to use the default prompt. The output format (JSON
            schema) is fixed — only the instructions change.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
