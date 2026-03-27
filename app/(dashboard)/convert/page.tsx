"use client";

import { ConvertConfig } from "@/components/convert-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConvertSettings } from "@/lib/hooks/use-convert-settings";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import { convertText, useQTEngineReady } from "@/lib/hooks/use-qt-engine";
import {
  ArrowRightLeftIcon,
  CheckIcon,
  ClipboardCopyIcon,
  LoaderIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ConvertPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const engineReady = useQTEngineReady();
  const convertOptions = useConvertSettings();
  const debouncedInput = useDebouncedValue(input, 500);
  const seqRef = useRef(0);

  const handleConvert = useCallback(async () => {
    if (!input.trim()) return;
    const seq = ++seqRef.current;
    setIsConverting(true);
    try {
      const result = await convertText(input, { options: convertOptions });
      if (seqRef.current === seq) setOutput(result.plainText);
    } catch (err) {
      toast.error(
        "Lỗi convert: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      if (seqRef.current === seq) setIsConverting(false);
    }
  }, [input, convertOptions]);

  useEffect(() => {
    if (!liveMode || !engineReady) return;
    if (!debouncedInput.trim()) {
      setOutput("");
      return;
    }
    const seq = ++seqRef.current;
    setIsConverting(true);
    convertText(debouncedInput, { options: convertOptions })
      .then((result) => {
        if (seqRef.current === seq) setOutput(result.plainText);
      })
      .catch((err) => {
        if (seqRef.current === seq)
          toast.error(
            "Lỗi convert: " +
              (err instanceof Error ? err.message : String(err)),
          );
      })
      .finally(() => {
        if (seqRef.current === seq) setIsConverting(false);
      });
  }, [liveMode, debouncedInput, convertOptions, engineReady]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Đã sao chép");
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Convert nhanh</h1>
          <p className="text-muted-foreground text-sm">
            Dán văn bản tiếng Trung và convert sang tiếng Việt bằng từ điển QT.
            Không cần API key.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="live-mode"
              checked={liveMode}
              onCheckedChange={setLiveMode}
              disabled={!engineReady}
            />
            <Label htmlFor="live-mode" className="text-sm">
              Live
            </Label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="mr-1.5 size-3.5" />
                Cài đặt
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <ConvertConfig />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <label className="text-sm font-medium">Văn bản gốc (Trung)</label>
            {input && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClear}
                title="Xóa"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dán văn bản tiếng Trung vào đây..."
            className="h-[calc(100vh-280px)] resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <label className="text-sm font-medium">
              Kết quả (Việt)
              {liveMode && isConverting && (
                <LoaderIcon className="text-muted-foreground ml-2 inline size-3.5 animate-spin" />
              )}
            </label>
            {output && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckIcon className="mr-1.5 size-3.5" />
                ) : (
                  <ClipboardCopyIcon className="mr-1.5 size-3.5" />
                )}
                {copied ? "Đã sao chép" : "Sao chép"}
              </Button>
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="Kết quả convert sẽ hiển thị ở đây..."
            className="bg-muted/30 h-[calc(100vh-280px)] resize-none font-mono text-sm"
          />
        </div>
      </div>

      {/* Convert button — hidden in live mode */}
      {!liveMode && (
        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            onClick={handleConvert}
            disabled={isConverting || !input.trim() || !engineReady}
          >
            <ArrowRightLeftIcon className="mr-2 size-4" />
            {isConverting
              ? "Đang convert..."
              : !engineReady
                ? "Đang tải từ điển..."
                : "Convert"}
          </Button>
        </div>
      )}
    </main>
  );
}
