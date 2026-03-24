import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Trash2Icon } from "lucide-react";

export function ChatHistoryDialog({
  open,
  onOpenChange,
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: { id: string; title: string; updatedAt: Date }[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat History</DialogTitle>
          <DialogDescription>
            Switch to a previous conversation or delete old ones.
          </DialogDescription>
        </DialogHeader>
        {conversations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No conversations yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={cn(
                  "group/item flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                  convo.id === activeConversationId && "bg-muted",
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                  onClick={() => onSelect(convo.id)}
                >
                  <span className="w-full truncate font-medium">
                    {convo.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {convo.updatedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(convo.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
                  title="Delete conversation"
                >
                  <Trash2Icon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
