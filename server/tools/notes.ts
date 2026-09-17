import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const notesTool: JarvisToolDefinition = {
  id: "tool-notes",
  name: "manageNotes",
  displayName: "Workspace Notes & Scratchpad",
  version: "1.0.0",
  category: "productivity",
  enabled: true,
  description: "Create quick notes, task checklists, design specifications, or summarize scratchpads.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'create_note', 'list_notes', or 'search_notes'.",
      },
      title: {
        type: Type.STRING,
        description: "Title of the note.",
      },
      content: {
        type: Type.STRING,
        description: "Body or bullet points of the note.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Optional tags, e.g. ['project', 'todo', 'idea'].",
      },
    },
    required: ["action"],
  },
  execute: (args, context) => {
    const action = args?.action || "list_notes";

    if (action === "create_note") {
      const newNote = {
        id: `note-${Date.now()}`,
        title: args?.title || "Untitled Note",
        content: args?.content || "",
        tags: args?.tags || [],
        timestamp: new Date().toISOString(),
      };
      context.addNote(newNote);

      return {
        result: {
          status: "Note recorded in workspace scratchpad",
          note: newNote,
          totalNotes: context.notes.length + 1,
        },
        sideEffect: { type: "NOTE_CREATED", note: newNote },
      };
    }

    return {
      result: {
        notes: context.notes,
        count: context.notes.length,
      },
    };
  },
};
