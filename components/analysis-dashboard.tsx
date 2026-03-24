"use client";

import { useState } from "react";
import {
  GlobeIcon,
  UsersIcon,
  MapPinIcon,
  SwordsIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldIcon,
  CpuIcon,
  ScrollTextIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NovelAnalysis, Character, Chapter } from "@/lib/db";

interface AnalysisDashboardProps {
  analysis: NovelAnalysis;
  characters: Character[];
  chapters: Chapter[];
}

export function AnalysisDashboard({
  analysis,
  characters,
  chapters,
}: AnalysisDashboardProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(
    null,
  );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenIcon className="size-4" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.genres.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.genres.map((genre) => (
                  <Badge key={genre} variant="default">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.synopsis && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Synopsis</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {analysis.synopsis}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Characters */}
      {characters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              Characters
            </CardTitle>
            <CardDescription>
              {characters.length} character{characters.length !== 1 ? "s" : ""}{" "}
              identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {characters.map((char) => {
                const isExpanded = expandedCharacter === char.id;
                return (
                  <div key={char.id} className="rounded-lg border">
                    <button
                      onClick={() =>
                        setExpandedCharacter(isExpanded ? null : char.id)
                      }
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{char.name}</span>
                        {char.role && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {char.role}
                          </Badge>
                        )}
                      </div>
                      {char.sex && (
                        <span className="text-xs text-muted-foreground">
                          {char.sex}
                          {char.age && char.age !== "Unknown" ? `, ${char.age}` : ""}
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t px-3 pb-3 pt-2">
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          {char.description && (
                            <div className="sm:col-span-2">
                              <p className="font-medium text-muted-foreground">
                                Description
                              </p>
                              <p className="mt-0.5">{char.description}</p>
                            </div>
                          )}
                          {char.appearance && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Appearance
                              </p>
                              <p className="mt-0.5">{char.appearance}</p>
                            </div>
                          )}
                          {char.personality && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Personality
                              </p>
                              <p className="mt-0.5">{char.personality}</p>
                            </div>
                          )}
                          {char.hobbies && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Hobbies
                              </p>
                              <p className="mt-0.5">{char.hobbies}</p>
                            </div>
                          )}
                          {char.strengths && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Strengths
                              </p>
                              <p className="mt-0.5">{char.strengths}</p>
                            </div>
                          )}
                          {char.weaknesses && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Weaknesses
                              </p>
                              <p className="mt-0.5">{char.weaknesses}</p>
                            </div>
                          )}
                          {char.motivations && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Motivations
                              </p>
                              <p className="mt-0.5">{char.motivations}</p>
                            </div>
                          )}
                          {char.goals && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Goals
                              </p>
                              <p className="mt-0.5">{char.goals}</p>
                            </div>
                          )}
                          {char.relationshipWithMC && (
                            <div>
                              <p className="font-medium text-muted-foreground">
                                Relationship with MC
                              </p>
                              <p className="mt-0.5">
                                {char.relationshipWithMC}
                              </p>
                            </div>
                          )}
                          {char.characterArc && (
                            <div className="sm:col-span-2">
                              <p className="font-medium text-muted-foreground">
                                Character Arc
                              </p>
                              <p className="mt-0.5">{char.characterArc}</p>
                            </div>
                          )}
                          {char.relationships &&
                            char.relationships.length > 0 && (
                              <div className="sm:col-span-2">
                                <p className="font-medium text-muted-foreground">
                                  Relationships
                                </p>
                                <div className="mt-1 space-y-1">
                                  {char.relationships.map((rel, i) => (
                                    <p key={i} className="text-sm">
                                      <span className="font-medium">
                                        {rel.characterName}
                                      </span>
                                      : {rel.description}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* World Building */}
      {(analysis.worldOverview ||
        analysis.powerSystem ||
        analysis.storySetting) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlobeIcon className="size-4" />
              World Building
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.worldOverview && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                  <GlobeIcon className="size-3.5" />
                  World Overview
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis.worldOverview}
                </p>
              </div>
            )}

            {analysis.storySetting && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                    <MapPinIcon className="size-3.5" />
                    Setting
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.storySetting}
                  </p>
                  {analysis.timePeriod && (
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Time period: {analysis.timePeriod}
                    </p>
                  )}
                </div>
              </>
            )}

            {analysis.powerSystem && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                    <SwordsIcon className="size-3.5" />
                    Power System
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.powerSystem}
                  </p>
                </div>
              </>
            )}

            {analysis.factions && analysis.factions.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <ShieldIcon className="size-3.5" />
                    Factions & Organizations
                  </p>
                  <div className="space-y-2">
                    {analysis.factions.map((f, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {f.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {analysis.keyLocations && analysis.keyLocations.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <MapPinIcon className="size-3.5" />
                    Key Locations
                  </p>
                  <div className="space-y-2">
                    {analysis.keyLocations.map((loc, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{loc.name}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {loc.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {analysis.worldRules && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                    <ScrollTextIcon className="size-3.5" />
                    World Rules
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.worldRules}
                  </p>
                </div>
              </>
            )}

            {analysis.technologyLevel && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                    <CpuIcon className="size-3.5" />
                    Technology Level
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.technologyLevel}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chapter Summaries */}
      {chapters.some((ch) => ch.summary) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="size-4" />
              Chapter Summaries
            </CardTitle>
            <CardDescription>
              {chapters.filter((ch) => ch.summary).length} chapters analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1">
                {chapters
                  .filter((ch) => ch.summary)
                  .map((ch) => {
                    const isExpanded = expandedChapter === ch.id;
                    return (
                      <div key={ch.id}>
                        <button
                          onClick={() =>
                            setExpandedChapter(isExpanded ? null : ch.id)
                          }
                          className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted/50"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {ch.title}
                          </span>
                        </button>
                        {isExpanded && ch.summary && (
                          <div className="ml-6 pb-2">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {ch.summary}
                            </p>
                            {ch.characterIds && ch.characterIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {ch.characterIds.map((cid) => {
                                  const char = characters.find(
                                    (c) => c.id === cid,
                                  );
                                  return char ? (
                                    <Badge
                                      key={cid}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {char.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
