import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  ChevronDown,
  ChevronUp,
  LoaderIcon,
  PencilIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useStickToBottom } from "use-stick-to-bottom";
import { chatStreamdownComponents } from "./streamdown-components";

export function MessageBubble({
  message,
  isStreaming = false,
  onEdit,
  onRerun,
}: {
  message: { role: string; content: string; reasoning?: string };
  isStreaming?: boolean;
  onEdit?: (newContent: string) => void;
  onRerun?: () => void;
}) {
  const isUser = message.role === "user";
  const [reasoningOpenManual, setReasoningOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const {
    scrollRef: reasoningScrollRef,
    contentRef: reasoningContentRef,
  } = useStickToBottom();
  const hasReasoning = !!message.reasoning;
  // Auto-open while streaming thinking, otherwise respect manual toggle
  const reasoningOpen =
    (isStreaming && hasReasoning && !message.content) || reasoningOpenManual;

  function startEdit() {
    setEditText(message.content);
    setEditing(true);
  }

  function confirmEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(trimmed);
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      confirmEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return (
    <div
      className={cn(
        "group/msg flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {isUser ? "You" : "Assistant"}
      </span>

      {/* Reasoning / thinking block */}
      {hasReasoning && (
        <div className="max-w-[85%]">
          <button
            type="button"
            onClick={() => setReasoningOpen(!reasoningOpen)}
            className="mb-1 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
          >
            <LoaderIcon
              className={cn(
                "size-3",
                isStreaming && !message.content && "animate-spin",
              )}
            />
            {isStreaming && !message.content
              ? "Thinking..."
              : "Thought for a moment"}
            {reasoningOpen ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>
          {reasoningOpen && (
            <div
              ref={reasoningScrollRef}
              className="mb-2 max-h-48 overflow-y-auto rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground"
            >
              <div ref={reasoningContentRef}>
                <Streamdown
                  mode={isStreaming ? "streaming" : "static"}
                  components={chatStreamdownComponents}
                >
                  {message.reasoning}
                </Streamdown>
              </div>
            </div>
          )}
        </div>
      )}

      {(isUser || message.content) && (
        <div
          className={cn(
            "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {isUser && editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="field-sizing-content max-h-32 min-h-8 w-full resize-none rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-1.5 text-[13px] text-primary-foreground outline-none placeholder:text-primary-foreground/50"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <XIcon />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={confirmEdit}
                  className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <CheckIcon />
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content || "\u00A0"}</p>
          ) : (
            <Streamdown
              mode={isStreaming ? "streaming" : "static"}
              controls={{ code: { copy: true } }}
              components={chatStreamdownComponents}
            >
              {message.content}
            </Streamdown>
          )}
        </div>
      )}

      {/* Edit / Rerun actions for user messages */}
      {isUser && !editing && (onEdit || onRerun) && (
        <div className="flex gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={startEdit}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Edit message"
            >
              <PencilIcon size={12} />
            </button>
          )}
          {onRerun && (
            <button
              type="button"
              onClick={onRerun}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Rerun message"
            >
              <RefreshCwIcon size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
