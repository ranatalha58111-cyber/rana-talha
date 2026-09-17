import { ToolContext } from "./toolTypes";
import { toolRegistry } from "./tools/registry";

export interface GroqChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface GroqCompletionResult {
  reply: string;
  toolCalls: Array<{ name: string; args: any; result: any }>;
  sideEffects: any[];
  modelUsed?: string;
}

export const KNOWN_VALID_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

function normalizeGroqModel(requested: string): string {
  const clean = requested.replace(/^groq\//, "").trim();
  if (clean === "llama-3.1-8b-instant" || clean.includes("8b") || clean.includes("instant")) {
    return "llama-3.1-8b-instant";
  }
  if (clean === "gemma2-9b-it" || clean.includes("gemma")) {
    return "gemma2-9b-it";
  }
  if (clean === "mixtral-8x7b-32768" || clean.includes("mixtral")) {
    return "mixtral-8x7b-32768";
  }
  return "llama-3.3-70b-versatile";
}

export async function executeGroqChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  modelName: string = "llama-3.3-70b-versatile",
  toolContext: ToolContext,
  needsTools: boolean = false
): Promise<GroqCompletionResult> {
  const groqKey = process.env.GROQ_API_KEY || process.env.GROOQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const primaryModel = normalizeGroqModel(modelName);

  try {
    return await executeGroqWithModel(
      primaryModel,
      messages,
      systemPrompt,
      groqKey,
      toolContext,
      needsTools
    );
  } catch (err: any) {
    console.warn(`Groq primary ${primaryModel} failed, trying ultra-fast instant:`, err?.message || err);
    return await executeGroqWithModel(
      "llama-3.1-8b-instant",
      messages,
      systemPrompt,
      groqKey,
      toolContext,
      false
    );
  }
}

async function executeGroqWithModel(
  cleanModel: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  groqKey: string,
  toolContext: ToolContext,
  needsTools: boolean = false
): Promise<GroqCompletionResult> {
  // Build OpenAI-compatible tools from enabled tools only if needed
  let openAiTools: any[] = [];
  if (needsTools) {
    const enabledTools = toolRegistry.getEnabledTools();
    openAiTools = enabledTools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters || { type: "object", properties: {} },
      },
    }));
  }

  const chatMessages: GroqChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content || "",
    })),
  ];

  const payload: any = {
    model: cleanModel,
    messages: chatMessages,
    temperature: 0.6,
    max_tokens: 1024,
  };

  if (openAiTools.length > 0) {
    payload.tools = openAiTools;
    payload.tool_choice = "auto";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(4500),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  const executedTools: Array<{ name: string; args: any; result: any }> = [];
  const sideEffects: any[] = [];

  // Check if Groq called any tools
  if (message?.tool_calls && message.tool_calls.length > 0) {
    chatMessages.push(message);

    for (const call of message.tool_calls) {
      const toolName = call.function.name;
      let toolArgs: any = {};
      try {
        toolArgs = JSON.parse(call.function.arguments || "{}");
      } catch {
        toolArgs = {};
      }

      const execution = await toolRegistry.executeTool(toolName, toolArgs, toolContext);
      executedTools.push({
        name: toolName,
        args: toolArgs,
        result: execution.result,
      });

      if (execution.sideEffect) {
        sideEffects.push(execution.sideEffect);
      }

      chatMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: toolName,
        content: JSON.stringify(execution.result),
      });
    }

    // Call Groq again to synthesize the final reply with tool answers
    const followUpRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cleanModel,
        messages: chatMessages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(4500),
    });

    if (followUpRes.ok) {
      const followUpData = await followUpRes.json();
      const finalReply = followUpData.choices?.[0]?.message?.content || "";
      return {
        reply: finalReply,
        toolCalls: executedTools,
        sideEffects,
        modelUsed: cleanModel,
      };
    }
  }

  return {
    reply: message?.content || "JARVIS ready for command, sir.",
    toolCalls: executedTools,
    sideEffects,
    modelUsed: cleanModel,
  };
}
