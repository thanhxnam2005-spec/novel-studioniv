"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useNovels } from "@/lib/hooks";
import { BookOpenIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const novels = useNovels();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick up where you left off, or start something new.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer border-dashed transition-colors hover:border-foreground/20 hover:bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <PlusIcon className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium">New Novel</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Start a fresh story
            </p>
          </CardContent>
        </Card>

        <Link href="/import" className="sm:col-span-1 lg:col-span-2">
          <Card className="h-full cursor-pointer border-dashed transition-colors hover:border-foreground/20 hover:bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <UploadIcon className="size-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Import Novel</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Upload or paste existing text
              </p>
            </CardContent>
          </Card>
        </Link>

        {novels === undefined ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : novels.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenIcon />
                  </EmptyMedia>
                  <EmptyTitle>Your library is empty</EmptyTitle>
                  <EmptyDescription>
                    Create your first novel or import an existing one.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          novels.slice(0, 5).map((novel) => (
            <Card
              key={novel.id}
              className="transition-colors hover:bg-muted/30"
            >
              <CardHeader>
                <CardTitle>{novel.title}</CardTitle>
                {novel.genre && (
                  <CardDescription>{novel.genre}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {novel.description || "No description yet."}
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/novels/${novel.id}/analysis`}>
                      <SearchIcon className="mr-1.5 size-3.5" />
                      Analyze
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {novels && novels.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" asChild>
            <a href="/library">View all novels</a>
          </Button>
        </div>
      )}
    </main>
  );
}
