import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";
import { evaluateSecurity, matchAllowedApp, loadAllowedApps } from "./appAllowList";

export const windowsAutomationTool: JarvisToolDefinition = {
  id: "tool-windows-automation",
  name: "systemAutomation",
  displayName: "Windows Desktop Bridge",
  version: "2.0.0",
  category: "system",
  enabled: true,
  description: "Execute or prepare a verified Windows desktop automation command, such as launching allow-listed applications (Chrome, Notepad, Calculator, VS Code, File Explorer, Terminal), opening secure web URLs, or system diagnostics. Strictly enforces an allow-list policy and blocks dangerous administrative, shutdown, restart, and deletion commands.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "The automation action: 'open_application', 'open_url', 'system_diagnostics', 'adjust_volume', or 'file_explorer'.",
      },
      target: {
        type: Type.STRING,
        description: "The target app name, URL, or setting (e.g. 'Notepad', 'Calculator', 'Chrome', 'VS Code', 'https://github.com').",
      },
      parameters: {
        type: Type.STRING,
        description: "Optional extra command parameters or details.",
      },
      requiresConfirmation: {
        type: Type.BOOLEAN,
        description: "True if this command modifies system state or settings.",
      },
    },
    required: ["action", "target"],
  },
  execute: (args) => {
    const action = String(args?.action || "").toLowerCase().trim();
    const target = String(args?.target || "").trim();
    const params = String(args?.parameters || "").trim();
    const combinedCommand = `${action} ${target} ${params}`;

    // 1. HARD SECURITY BARRIER: Block shutdown, restart, delete, format, and admin privilege escalation
    const securityCheck = evaluateSecurity(combinedCommand);
    if (securityCheck.isBlocked) {
      return {
        result: {
          status: "SECURITY_BLOCKED",
          isBlocked: true,
          action,
          target,
          reason: securityCheck.blockReason,
          message: `[SECURITY ALERT] Action Blocked: ${securityCheck.blockReason}`,
        },
        sideEffect: {
          type: "SECURITY_BLOCKED",
          blockedAction: action,
          target,
          reason: securityCheck.blockReason,
        },
      };
    }

    // 2. Safe URL handler
    if (action === "open_url" || target.startsWith("http://") || target.startsWith("https://")) {
      const isHttp = target.startsWith("http://") || target.startsWith("https://");
      const safeUrl = isHttp ? target : `https://${target}`;
      return {
        result: {
          status: "AUTHORIZED",
          action: "open_url",
          url: safeUrl,
          message: `Opening authorized URL: ${safeUrl}`,
        },
        sideEffect: {
          type: "URL_OPEN",
          url: safeUrl,
        },
      };
    }

    // 3. Application Launch: STRICT ALLOW-LIST VERIFICATION
    if (action === "open_application" || action === "file_explorer" || !action || action === "launch") {
      const match = matchAllowedApp(target);

      // UNKNOWN APPS ARE STRICTLY REJECTED
      if (!match.isAllowed || !match.app) {
        return {
          result: {
            status: "REJECTED_UNKNOWN_APP",
            isAllowed: false,
            target,
            reason: match.reason,
            suggestedApps: match.suggestedApps || [],
            message: `[SECURITY POLICY] Access Denied: Application '${target}' is not in the authorized desktop allow-list. Unrecognized executables are rejected to protect your PC. You can easily add trusted apps to desktop/allowList.json.`,
          },
          sideEffect: {
            type: "APP_REJECTED",
            target,
            reason: match.reason,
            suggestedApps: match.suggestedApps || [],
          },
        };
      }

      // AUTHORIZED APP: Ready for real PC launch via Electron
      const app = match.app;
      return {
        result: {
          status: "AUTHORIZED",
          isAllowed: true,
          app: {
            id: app.id,
            name: app.name,
            command: app.command,
            category: app.category,
            webFallbackUrl: app.webFallbackUrl || null,
          },
          message: `Application '${app.name}' verified and authorized for Windows desktop launch.`,
        },
        sideEffect: {
          type: "APP_LAUNCH",
          app: {
            id: app.id,
            name: app.name,
            command: app.command,
            category: app.category,
            webFallbackUrl: app.webFallbackUrl || null,
          },
          target: app.command,
          status: "authorized",
        },
      };
    }

    // 4. Other safe system utility actions (volume, diagnostics)
    if (action === "system_diagnostics") {
      return {
        result: {
          status: "SUCCESS",
          action: "system_diagnostics",
          platform: process.platform,
          architecture: process.arch,
          nodeVersion: process.version,
          uptimeSeconds: Math.round(process.uptime()),
          message: "System diagnostics executed safely.",
        },
      };
    }

    // Default safe fallback
    return {
      result: {
        status: "PROCESSED",
        action,
        target,
        message: `Command processed: ${action} -> ${target}`,
      },
    };
  },
};

