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
      toast.success("Đã lưu chỉ thị chung");
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉ thị hệ thống chung</CardTitle>
        <CardDescription>
          Chỉ thị này được thêm vào đầu mọi system prompt — cả trò chuyện và
          phân tích. Sử dụng cho tùy chọn ngôn ngữ, giọng điệu, hoặc ràng buộc
          cần luôn áp dụng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="VD: Luôn trả lời bằng Tiếng Việt. Sử dụng giọng văn trang trọng."
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[100px] font-mono text-sm"
        />
        {isDirty && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
