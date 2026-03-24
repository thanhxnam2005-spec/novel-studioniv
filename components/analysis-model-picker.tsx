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
    label: "Phân tích chương",
    description: "Phân tích từng chương để lấy tóm tắt, cảnh và nhân vật",
  },
  {
    key: "aggregationModel",
    label: "Tổng quan tiểu thuyết",
    description: "Trích xuất thể loại, nhãn, tóm tắt và thế giới quan",
  },
  {
    key: "characterModel",
    label: "Lập hồ sơ nhân vật",
    description: "Xây dựng hồ sơ nhân vật chi tiết từ dữ liệu xuyên chương",
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
            Mặc định
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Nhà cung cấp</Label>
          <NativeSelect
            className="mt-1 w-full"
            value={selectedProviderId}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <NativeSelectOption value="">Mặc định</NativeSelectOption>
            {providers?.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label className="text-xs">Mô hình</Label>
          <NativeSelect
            className="mt-1 w-full"
            value={value?.modelId ?? ""}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!selectedProviderId}
          >
            <NativeSelectOption value="">
              {selectedProviderId ? "Chọn mô hình" : "Chọn nhà cung cấp trước"}
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
      toast.success("Đã lưu cài đặt mô hình");
    } catch {
      toast.error("Lưu cài đặt mô hình thất bại");
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
              Mô hình theo bước
              {hasAnyCustom && !isOpen && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (đã tùy chỉnh)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Sử dụng nhà cung cấp hoặc mô hình khác nhau cho từng bước phân tích
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
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Khi đặt là &ldquo;Mặc định&rdquo;, sẽ kế thừa nhà cung cấp và
            mô hình từ cài đặt trò chuyện chung.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
