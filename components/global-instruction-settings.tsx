"use client";

import { LineEditor } from "@/components/ui/line-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce";
import { useChatSettings, updateChatSettings } from "@/lib/hooks";
import { useEffect, useRef, useState } from "react";

export function GlobalInstructionSettings() {
  const settings = useChatSettings();
  const [value, setValue] = useState("");
  const initialized = useRef(false);

  // Sync from DB on initial load (useLiveQuery is async)
  useEffect(() => {
    if (!initialized.current && settings.globalSystemInstruction !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(settings.globalSystemInstruction ?? "");
      initialized.current = true;
    }
  }, [settings.globalSystemInstruction]);

  const save = useDebouncedCallback((v: string) => {
    updateChatSettings({
      globalSystemInstruction: v.trim() || undefined,
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
        <div className="h-[100px]">
          <LineEditor
            value={value}
            onChange={(v) => {
              initialized.current = true;
              setValue(v);
              save.run(v);
            }}
            placeholder="VD: Luôn trả lời bằng Tiếng Việt. Sử dụng giọng văn trang trọng."
            contentFont="text-sm leading-5"
            gutterFont="text-xs leading-5"
            xmlColors
          />
        </div>
      </CardContent>
    </Card>
  );
}
