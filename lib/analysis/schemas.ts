import { jsonSchema } from "ai";
import type {
  ChapterAnalysisResult,
  BatchChapterAnalysisResult,
  IntermediateSummaryResult,
  NovelAggregationResult,
  CharacterProfilingResult,
} from "./types";

export const chapterAnalysisSchema = jsonSchema<ChapterAnalysisResult>({
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise summary of the chapter (2-4 sentences)",
    },
    keyScenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short scene title" },
          description: {
            type: "string",
            description: "Brief description of the scene",
          },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
      description: "Key scenes or events in this chapter",
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Character name" },
          role: {
            type: "string",
            description:
              "Role in this chapter: protagonist, antagonist, supporting, or mentioned",
          },
          noteInChapter: {
            type: "string",
            description: "What the character did or how they appeared",
          },
        },
        required: ["name", "role", "noteInChapter"],
        additionalProperties: false,
      },
      description: "Characters that appear or are mentioned",
    },
  },
  required: ["summary", "keyScenes", "characters"],
  additionalProperties: false,
});

export const batchChapterAnalysisSchema =
  jsonSchema<BatchChapterAnalysisResult>({
    type: "object",
    properties: {
      chapters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A concise summary of the chapter (2-4 sentences)",
            },
            keyScenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
            characters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  noteInChapter: { type: "string" },
                },
                required: ["name", "role", "noteInChapter"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "keyScenes", "characters"],
          additionalProperties: false,
        },
      },
    },
    required: ["chapters"],
    additionalProperties: false,
  });

export const intermediateSummarySchema =
  jsonSchema<IntermediateSummaryResult>({
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "A cohesive summary of this group of chapters preserving key plot, characters, and world-building",
      },
    },
    required: ["summary"],
    additionalProperties: false,
  });

export const novelAggregationSchema = jsonSchema<NovelAggregationResult>({
  type: "object",
  properties: {
    genres: {
      type: "array",
      items: { type: "string" },
      description: "Literary genres (e.g. Fantasy, Romance, Sci-Fi)",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description:
        "Descriptive tags (e.g. slow-burn, isekai, cultivation, time-travel)",
    },
    synopsis: {
      type: "string",
      description:
        "A compelling synopsis of the entire novel (3-6 sentences)",
    },
    worldOverview: {
      type: "string",
      description: "Overview of the world and setting",
    },
    powerSystem: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Description of the power/magic system, or null if not applicable",
    },
    storySetting: {
      type: "string",
      description: "Physical and social setting of the story",
    },
    timePeriod: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Time period or era of the story, or null if unclear",
    },
    factions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "Major factions, organizations, or groups",
    },
    keyLocations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "Important locations in the story",
    },
    worldRules: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Key rules or laws of the world, or null if not applicable",
    },
    technologyLevel: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Technology level of the world, or null if not applicable",
    },
  },
  required: [
    "genres",
    "tags",
    "synopsis",
    "worldOverview",
    "powerSystem",
    "storySetting",
    "timePeriod",
    "factions",
    "keyLocations",
    "worldRules",
    "technologyLevel",
  ],
  additionalProperties: false,
});

export const characterProfilingSchema = jsonSchema<CharacterProfilingResult>({
  type: "object",
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name" },
          age: {
            type: "string",
            description: "Age or age range, or 'Unknown' if not stated",
          },
          sex: {
            type: "string",
            description: "Male, Female, or Other/Unknown",
          },
          role: {
            type: "string",
            description:
              "Story role: MC (main character), love interest, antagonist, supporting, minor",
          },
          appearance: {
            type: "string",
            description: "Physical appearance description",
          },
          personality: {
            type: "string",
            description: "Personality traits and temperament",
          },
          hobbies: {
            type: "string",
            description: "Hobbies, interests, and habits",
          },
          relationshipWithMC: {
            type: "string",
            description:
              "Relationship to the main character, or 'N/A - this is the MC' for the protagonist",
          },
          relationships: {
            type: "array",
            items: {
              type: "object",
              properties: {
                characterName: { type: "string" },
                description: {
                  type: "string",
                  description: "Nature of the relationship",
                },
              },
              required: ["characterName", "description"],
              additionalProperties: false,
            },
            description: "Relationships with other characters",
          },
          characterArc: {
            type: "string",
            description:
              "Character development and arc throughout the story",
          },
          strengths: { type: "string", description: "Key strengths" },
          weaknesses: {
            type: "string",
            description: "Key weaknesses or flaws",
          },
          motivations: {
            type: "string",
            description: "Core motivations and desires",
          },
          goals: {
            type: "string",
            description: "Goals and objectives in the story",
          },
          description: {
            type: "string",
            description: "Overall character summary (2-3 sentences)",
          },
        },
        required: [
          "name",
          "age",
          "sex",
          "role",
          "appearance",
          "personality",
          "hobbies",
          "relationshipWithMC",
          "relationships",
          "characterArc",
          "strengths",
          "weaknesses",
          "motivations",
          "goals",
          "description",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["characters"],
  additionalProperties: false,
});
