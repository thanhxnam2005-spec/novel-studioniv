"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Character } from "@/lib/db";
import { deleteCharacter } from "@/lib/hooks";
import { CharacterEditDialog } from "./character-edit-dialog";

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === "Unknown" || value === "N/A") return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-xs leading-relaxed">{value}</p>
    </div>
  );
}

function CharacterCard({
  char,
  onEdit,
  onDelete,
}: {
  char: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const hasDetails =
    char.appearance ||
    char.personality ||
    char.hobbies ||
    char.relationshipWithMC ||
    char.characterArc ||
    char.strengths ||
    char.weaknesses ||
    char.motivations ||
    char.goals ||
    (char.relationships && char.relationships.length > 0);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2">
            {hasDetails && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="mt-0.5 shrink-0"
                >
                  <ChevronDownIcon
                    className={`size-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
                  />
                </Button>
              </CollapsibleTrigger>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">{char.name}</CardTitle>
              {(char.role || char.age || char.sex) && (
                <CardDescription className="flex flex-wrap items-center gap-1.5">
                  {char.role && (
                    <Badge variant="outline" className="text-[11px]">
                      {char.role}
                    </Badge>
                  )}
                  {char.sex && char.sex !== "Unknown" && (
                    <span className="text-xs">{char.sex}</span>
                  )}
                  {char.age && char.age !== "Unknown" && (
                    <span className="text-xs">· {char.age}</span>
                  )}
                </CardDescription>
              )}
            </div>
          </div>
          <CardAction>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onEdit}
              >
                <PencilIcon className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onDelete}
              >
                <TrashIcon className="size-3" />
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {char.description || "Chưa có mô tả"}
          </p>

          <CollapsibleContent>
            <Separator className="my-2.5" />
            <div className="space-y-2.5">
              <DetailRow label="Ngoại hình" value={char.appearance} />
              <DetailRow label="Tính cách" value={char.personality} />
              <DetailRow label="Sở thích" value={char.hobbies} />
              <DetailRow
                label="Quan hệ với nhân vật chính"
                value={char.relationshipWithMC}
              />
              {char.relationships && char.relationships.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Mối quan hệ
                  </p>
                  <div className="mt-0.5 space-y-0.5">
                    {char.relationships.map((r, i) => (
                      <p key={i} className="text-xs">
                        <span className="font-medium">{r.characterName}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {r.description}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <DetailRow label="Hành trình nhân vật" value={char.characterArc} />
              <DetailRow label="Điểm mạnh" value={char.strengths} />
              <DetailRow label="Điểm yếu" value={char.weaknesses} />
              <DetailRow label="Động lực" value={char.motivations} />
              <DetailRow label="Mục tiêu" value={char.goals} />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export function CharactersTab({
  characters,
  novelId,
}: {
  characters: Character[];
  novelId: string;
}) {
  const [editChar, setEditChar] = useState<Character | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCharacter(deleteTarget.id);
      toast.success(`Đã xóa ${deleteTarget.name}`);
    } catch {
      toast.error("Xóa thất bại");
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {characters.length} nhân vật
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="mr-1.5 size-3.5" />
          Thêm nhân vật
        </Button>
      </div>

      {characters.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Chưa có nhân vật. Thêm thủ công hoặc chạy phân tích.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              onEdit={() => {
                setEditChar(char);
                setEditOpen(true);
              }}
              onDelete={() => setDeleteTarget(char)}
            />
          ))}
        </div>
      )}

      <CharacterEditDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        novelId={novelId}
      />

      {editChar && (
        <CharacterEditDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditChar(undefined);
          }}
          novelId={novelId}
          character={editChar}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhân vật</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa &quot;{deleteTarget?.name}&quot;? Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
