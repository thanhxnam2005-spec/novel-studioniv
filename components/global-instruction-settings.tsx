"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const save = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await updateChatSettings({
        globalSystemInstruction: value.trim() || undefined,
      });
    }, 600);
  }, []);

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
          onChange={(e) => save(e.target.value)}
          className="min-h-[100px] font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
