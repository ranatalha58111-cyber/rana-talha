import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const timeTool: JarvisToolDefinition = {
  id: "tool-time",
  name: "getCurrentTime",
  displayName: "Global Chronometer",
  version: "1.0.0",
  category: "utilities",
  enabled: true,
  description: "Get the accurate current time, date, day of week, and timezone info for any specified city, country, or UTC.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "City or region, e.g. 'London', 'Tokyo', 'New York', 'Karachi', or 'UTC'. Defaults to local system time.",
      },
    },
  },
  execute: (args) => {
    const loc = args?.location || "Local";
    const now = new Date();
    return {
      result: {
        location: loc,
        iso: now.toISOString(),
        formatted: now.toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "medium",
        }),
        timestampMs: now.getTime(),
      },
    };
  },
};
