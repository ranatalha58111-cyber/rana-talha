import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const emailTool: JarvisToolDefinition = {
  id: "tool-email",
  name: "emailDispatcher",
  displayName: "Email & Communication Bridge",
  version: "1.0.0",
  category: "integrations",
  enabled: false,
  description: "Draft, summarize, or prepare email dispatches and client correspondence.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'draft_email', 'check_inbox', or 'send_email'.",
      },
      recipient: {
        type: Type.STRING,
        description: "Recipient email or name.",
      },
      subject: {
        type: Type.STRING,
        description: "Email subject line.",
      },
      body: {
        type: Type.STRING,
        description: "Email text body.",
      },
    },
    required: ["action"],
  },
  execute: (args) => {
    const action = args?.action || "draft_email";
    return {
      result: {
        provider: "Mail Adapter Bridge",
        action,
        recipient: args?.recipient || "user@example.com",
        subject: args?.subject || "Update from JARVIS",
        status: action === "send_email" ? "Queued for dispatch" : "Draft created",
      },
      sideEffect: {
        type: "EMAIL_DISPATCH",
        action,
        recipient: args?.recipient,
      },
    };
  },
};
