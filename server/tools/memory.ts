import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const memoryTool: JarvisToolDefinition = {
  id: "tool-memory",
  name: "saveMemory",
  displayName: "Neural Memory Core",
  version: "1.3.0",
  category: "system",
  enabled: true,
  description: "Permanently remember important user facts, project names, user preferences, instructions, or biographical info across sessions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: {
        type: Type.STRING,
        description: "A short topic or label for this memory, e.g. 'User Name', 'Project Alpha', 'Preferred Language'.",
      },
      fact: {
        type: Type.STRING,
        description: "The exact information or fact to store.",
      },
    },
    required: ["key", "fact"],
  },
  execute: (args, context) => {
    const newItem = context.addMemory(String(args?.key || "Fact"), String(args?.fact || ""));
    return {
      result: {
        status: "Memory saved successfully to persistent core",
        savedItem: newItem,
      },
      sideEffect: { type: "MEMORY_ADDED", item: newItem },
    };
  },
};
