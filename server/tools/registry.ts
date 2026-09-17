import { FunctionDeclaration, Type } from "@google/genai";
import { JarvisToolDefinition, ToolContext, ToolResult, CustomPluginPayload } from "../toolTypes";
import { webSearchTool } from "./webSearch";
import { weatherTool } from "./weather";
import { timeTool } from "./time";
import { memoryTool } from "./memory";
import { windowsAutomationTool } from "./windowsAutomation";
import { calculatorTool } from "./calculator";
import { calendarTool } from "./calendar";
import { notesTool } from "./notes";
import { spotifyTool } from "./spotify";
import { emailTool } from "./email";
import { launchApplicationTool, scrollScreenTool, controlMediaTool } from "./pcControlTools";

class ToolRegistry {
  private tools: Map<string, JarvisToolDefinition> = new Map();

  constructor() {
    this.registerBuiltIns();
  }

  private registerBuiltIns() {
    this.registerTool(launchApplicationTool);
    this.registerTool(scrollScreenTool);
    this.registerTool(controlMediaTool);
    this.registerTool(windowsAutomationTool);
    this.registerTool(webSearchTool);
    this.registerTool(weatherTool);
    this.registerTool(timeTool);
    this.registerTool(memoryTool);
    this.registerTool(calculatorTool);
    this.registerTool(calendarTool);
    this.registerTool(notesTool);
    this.registerTool(spotifyTool);
    this.registerTool(emailTool);
  }

  public registerTool(tool: JarvisToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  public getAllTools(): JarvisToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getEnabledTools(): JarvisToolDefinition[] {
    return Array.from(this.tools.values()).filter((t) => t.enabled);
  }

  public toggleTool(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = enabled;
      return true;
    }
    return false;
  }

  public registerCustomPlugin(payload: CustomPluginPayload): JarvisToolDefinition {
    const safeFunctionName = payload.name.replace(/[^a-zA-Z0-9_]/g, "");
    const pluginId = `plugin-${Date.now()}`;

    const newPlugin: JarvisToolDefinition = {
      id: pluginId,
      name: safeFunctionName,
      displayName: payload.displayName || payload.name,
      version: payload.version || "1.0.0",
      category: payload.category || "plugins",
      description: payload.description,
      isPlugin: true,
      enabled: true,
      parameters: {
        type: Type.OBJECT,
        properties: {
          [payload.parameterName || "query"]: {
            type: Type.STRING,
            description: payload.parameterDescription || "Input parameter for custom plugin",
          },
        },
        required: [payload.parameterName || "query"],
      },
      execute: (args) => {
        const paramVal = args?.[payload.parameterName || "query"] || "";
        const formattedResp = payload.mockResponseTemplate
          ? payload.mockResponseTemplate.replace("{{input}}", paramVal)
          : `Custom plugin ${payload.displayName} executed with input: ${paramVal}`;

        return {
          result: {
            plugin: payload.displayName,
            version: payload.version,
            status: "success",
            output: formattedResp,
            receivedInput: paramVal,
          },
          sideEffect: {
            type: "PLUGIN_EXECUTED",
            pluginName: payload.displayName,
            output: formattedResp,
          },
        };
      },
    };

    this.tools.set(pluginId, newPlugin);
    return newPlugin;
  }

  public removePlugin(pluginId: string): boolean {
    const tool = this.tools.get(pluginId);
    if (tool && tool.isPlugin) {
      this.tools.delete(pluginId);
      return true;
    }
    return false;
  }

  public getEnabledFunctionDeclarations(): FunctionDeclaration[] {
    return this.getEnabledTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  public getDiscoveryReport(): string {
    const enabled = this.getEnabledTools();
    const disabled = this.getAllTools().filter((t) => !t.enabled);

    let report = "Available Real-time Capabilities:\n";
    enabled.forEach((t) => {
      report += `✓ [ACTIVE] ${t.displayName} (${t.name} v${t.version}) - ${t.description}\n`;
    });

    if (disabled.length > 0) {
      report += "\nInactive/Disabled Capabilities (require user to enable in Plugins):\n";
      disabled.forEach((t) => {
        report += `✗ [OFF] ${t.displayName} (${t.name})\n`;
      });
    }

    return report;
  }

  public async executeTool(
    name: string,
    args: Record<string, any>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = Array.from(this.tools.values()).find((t) => t.name === name);
    if (!tool) {
      return {
        result: { error: `Tool ${name} is not registered in the system.` },
      };
    }
    if (!tool.enabled) {
      return {
        result: {
          error: `Tool ${tool.displayName} (${name}) is currently toggled OFF in JARVIS settings. Ask the user to enable it in the Plugins & Tools panel.`,
        },
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (err: any) {
      return {
        result: {
          error: `Execution error in ${name}: ${err.message || "Unknown error"}`,
        },
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
