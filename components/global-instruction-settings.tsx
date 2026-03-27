"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce";
import { useChatSettings, updateChatSettings } from "@/lib/hooks";

export function GlobalInstructionSettings() {
  const settings = useChatSettings();

  const save = useDebouncedCallback((value: string) => {
    updateChatSettings({
      globalSystemInstruction: value.trim() || undefined,
    });
  }, 600);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉ thị hệ thống chung</CardTitle>
        <CardDescription>
          Chỉ thị này được thêm vào đầu mọi system prompt — cả trò chuyện và
          phân tích. Sử dụng cho tùy chọn ngôn ngữ, giọng điệu, hoặc ràng buộc
          cần luôn áp dụng. Tự động lưu khi chỉnh sửa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="VD: Luôn trả lời bằng Tiếng Việt. Sử dụng giọng văn trang trọng."
          defaultValue={settings.globalSystemInstruction ?? ""}
          onChange={(e) => save.run(e.target.value)}
          className="min-h-[100px] font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
