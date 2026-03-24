"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChatSettings, updateChatSettings } from "@/lib/hooks";

export function GlobalInstructionSettings() {
  const settings = useChatSettings();
  const [draft, setDraft] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync draft when settings load
  useEffect(() => {
    if (!hasEdited) {
      setDraft(settings.globalSystemInstruction ?? "");
    }
  }, [settings.globalSystemInstruction, hasEdited]);

  const handleChange = (value: string) => {
    setDraft(value);
    setHasEdited(true);
  };

  const isDirty =
    hasEdited && draft !== (settings.globalSystemInstruction ?? "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChatSettings({
        globalSystemInstruction: draft.trim() || undefined,
      });
      setHasEdited(false);
      toast.success("Global instruction saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global System Instruction</CardTitle>
        <CardDescription>
          This instruction is prepended to every system prompt — both chat and
          analysis. Use it for language preferences, tone, or constraints that
          should always apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="e.g. Always respond in Vietnamese. Use formal tone."
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[100px] font-mono text-sm"
        />
        {isDirty && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
