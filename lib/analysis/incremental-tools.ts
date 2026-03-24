import { tool } from "ai";
import { z } from "zod";

// ─── Aggregation Tools ──────────────────────────────────────

export const updateSynopsisTool = tool({
  description: "Update the novel synopsis to incorporate new chapter content",
  inputSchema: z.object({
    synopsis: z.string().describe("The updated synopsis (3-6 sentences)"),
  }),
});

export const updateGenresTagsTool = tool({
  description: "Update genres and/or tags based on new content",
  inputSchema: z.object({
    genres: z.array(z.string()).describe("Complete updated list of genres"),
    tags: z.array(z.string()).describe("Complete updated list of tags"),
  }),
});

export const updateWorldBuildingTool = tool({
  description: "Update world-building fields. Only include fields that changed.",
  inputSchema: z.object({
    worldOverview: z.string().optional().describe("Updated world overview"),
    powerSystem: z
      .string()
      .nullable()
      .optional()
      .describe("Updated power system description, or null if N/A"),
    storySetting: z.string().optional().describe("Updated story setting"),
    timePeriod: z
      .string()
      .nullable()
      .optional()
      .describe("Updated time period"),
    worldRules: z
      .string()
      .nullable()
      .optional()
      .describe("Updated world rules"),
    technologyLevel: z
      .string()
      .nullable()
      .optional()
      .describe("Updated technology level"),
  }),
});

export const addFactionTool = tool({
  description: "Add a new faction or organization discovered in new chapters",
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

export const updateFactionTool = tool({
  description: "Update an existing faction's description",
  inputSchema: z.object({
    name: z.string().describe("Exact name of the existing faction"),
    description: z.string().describe("Updated description"),
  }),
});

export const addLocationTool = tool({
  description: "Add a new key location discovered in new chapters",
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

export const updateLocationTool = tool({
  description: "Update an existing location's description",
  inputSchema: z.object({
    name: z.string().describe("Exact name of the existing location"),
    description: z.string().describe("Updated description"),
  }),
});

export const aggregationTools = {
  update_synopsis: updateSynopsisTool,
  update_genres_tags: updateGenresTagsTool,
  update_world_building: updateWorldBuildingTool,
  add_faction: addFactionTool,
  update_faction: updateFactionTool,
  add_location: addLocationTool,
  update_location: updateLocationTool,
};

// ─── Character Tools ────────────────────────────────────────

const characterRelationshipSchema = z.object({
  characterName: z.string(),
  description: z.string().describe("Nature of the relationship"),
});

export const addCharacterTool = tool({
  description: "Add a brand new character discovered in new chapters",
  inputSchema: z.object({
    name: z.string(),
    role: z.string().describe("MC, love interest, antagonist, supporting, minor"),
    description: z.string().describe("Overall character summary"),
    age: z.string().optional(),
    sex: z.string().optional(),
    appearance: z.string().optional(),
    personality: z.string().optional(),
    hobbies: z.string().optional(),
    relationshipWithMC: z.string().optional(),
    relationships: z.array(characterRelationshipSchema).optional(),
    characterArc: z.string().optional(),
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    motivations: z.string().optional(),
    goals: z.string().optional(),
  }),
});

export const updateCharacterTool = tool({
  description:
    "Update fields on an existing character. Only include fields that changed.",
  inputSchema: z.object({
    name: z.string().describe("Exact name of the existing character"),
    role: z.string().optional(),
    description: z.string().optional(),
    age: z.string().optional(),
    sex: z.string().optional(),
    appearance: z.string().optional(),
    personality: z.string().optional(),
    hobbies: z.string().optional(),
    relationshipWithMC: z.string().optional(),
    characterArc: z.string().optional(),
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    motivations: z.string().optional(),
    goals: z.string().optional(),
  }),
});

export const addRelationshipTool = tool({
  description: "Add a relationship to an existing character",
  inputSchema: z.object({
    characterName: z.string().describe("Name of the character to update"),
    relatedTo: z.string().describe("Name of the related character"),
    description: z.string().describe("Nature of the relationship"),
  }),
});

export const characterTools = {
  add_character: addCharacterTool,
  update_character: updateCharacterTool,
  add_relationship: addRelationshipTool,
};
