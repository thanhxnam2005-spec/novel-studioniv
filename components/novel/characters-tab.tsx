"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Character } from "@/lib/db";
import { deleteCharacter } from "@/lib/hooks";
import { CharacterEditDialog } from "./character-edit-dialog";

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
            <Card
              key={char.id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => {
                setEditChar(char);
                setEditOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{char.name}</CardTitle>
                {char.role && (
                  <CardDescription>
                    <Badge variant="outline" className="text-xs">
                      {char.role}
                    </Badge>
                    {char.age && char.age !== "Unknown" && (
                      <span className="ml-1.5 text-xs">{char.age}</span>
                    )}
                  </CardDescription>
                )}
                <CardAction>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(char);
                    }}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {char.description || "Chưa có mô tả"}
                </p>
              </CardContent>
            </Card>
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
