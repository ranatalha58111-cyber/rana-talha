import fs from "fs";
import path from "path";

export interface AllowedApp {
  id: string;
  name: string;
  aliases: string[];
  command: string;
  category: string;
  description: string;
  webFallbackUrl?: string | null;
}

export interface SecurityCheckResult {
  isBlocked: boolean;
  blockReason?: string;
  matchedDangerPattern?: string;
}

export interface AppMatchResult {
  isAllowed: boolean;
  app?: AllowedApp;
  reason?: string;
  suggestedApps?: string[];
}

// Strictly blocked commands & administrative danger patterns
const DANGEROUS_PATTERNS: Array<{ regex: RegExp; description: string }> = [
  {
    regex: /\b(shutdown|reboot|restart-computer|stop-computer|poweroff|halt|init\s+[06])\b/i,
    description: "System shutdown, restart, and power-off commands are strictly prohibited.",
  },
  {
    regex: /\b(del\b|rmdir\b|erase\b|rm\s+-rf|format\b|remove-item\b|diskpart|cipher\s+\/w|cleanmgr)\b/i,
    description: "File deletion, directory destruction, and disk formatting operations are blocked.",
  },
  {
    regex: /\b(net\s+user|net\s+localgroup|runas|takeown|icacls|reg\s+add|reg\s+delete|bcdedit|vssadmin)\b/i,
    description: "Administrative privilege escalation, user account modification, and system registry tampering are blocked.",
  },
  {
    regex: /\b(taskkill\s+\/f\s+\/im\s+(svchost|csrss|lsass|explorer|winlogon)|taskkill\s+\/f\s+\/pid\s+4)\b/i,
    description: "Termination of core Windows system processes is blocked.",
  },
  {
    regex: /\b(invoke-expression|iex\b|downloadstring|start-process\s+-verb\s+runas)\b/i,
    description: "Arbitrary shell code execution and elevated payload injection are blocked.",
  },
];

// Load allow-list from desktop/allowList.json with robust fallback
let cachedApps: AllowedApp[] = [];

export function loadAllowedApps(): AllowedApp[] {
  try {
    const jsonPath = path.resolve(process.cwd(), "desktop", "allowList.json");
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.apps)) {
        cachedApps = parsed.apps;
        return cachedApps;
      }
    }
  } catch (err) {
    console.warn("Could not read desktop/allowList.json from disk, using built-in list:", err);
  }

  // Built-in fallback list
  return [
    {
      id: "notepad",
      name: "Notepad",
      aliases: ["notepad", "text editor", "notes editor", "notepad.exe"],
      command: "notepad.exe",
      category: "productivity",
      description: "Built-in Windows lightweight text editor",
    },
    {
      id: "calculator",
      name: "Calculator",
      aliases: ["calculator", "calc", "calculation", "calc.exe"],
      command: "calc.exe",
      category: "utilities",
      description: "Windows official math and scientific calculator",
    },
    {
      id: "chrome",
      name: "Google Chrome",
      aliases: ["chrome", "google chrome", "browser", "web browser", "chrome.exe"],
      command: "chrome.exe",
      category: "browsers",
      description: "Fast and popular web browser by Google",
      webFallbackUrl: "https://www.google.com",
    },
    {
      id: "edge",
      name: "Microsoft Edge",
      aliases: ["edge", "microsoft edge", "msedge", "msedge.exe"],
      command: "msedge.exe",
      category: "browsers",
      description: "Built-in Microsoft Edge web browser",
      webFallbackUrl: "https://www.bing.com",
    },
    {
      id: "vscode",
      name: "Visual Studio Code",
      aliases: ["vscode", "vs code", "code", "visual studio code", "code.exe"],
      command: "code",
      category: "development",
      description: "Source code editor and IDE",
      webFallbackUrl: "https://vscode.dev",
    },
    {
      id: "explorer",
      name: "File Explorer",
      aliases: ["explorer", "file explorer", "files", "my computer", "this pc", "folder", "explorer.exe"],
      command: "explorer.exe",
      category: "system",
      description: "Windows file management browser",
    },
    {
      id: "terminal",
      name: "Windows Terminal",
      aliases: ["terminal", "windows terminal", "wt", "wt.exe"],
      command: "wt.exe",
      category: "utilities",
      description: "Modern tabbed command-line interface for Windows",
    },
    {
      id: "cmd",
      name: "Command Prompt",
      aliases: ["cmd", "command prompt", "command line", "cmd.exe"],
      command: "cmd.exe",
      category: "utilities",
      description: "Standard Windows command prompt",
    },
    {
      id: "taskmgr",
      name: "Task Manager",
      aliases: ["taskmgr", "task manager", "processes", "system monitor", "taskmgr.exe"],
      command: "taskmgr.exe",
      category: "system",
      description: "Windows performance and processes manager",
    },
    {
      id: "paint",
      name: "Paint",
      aliases: ["paint", "mspaint", "draw", "brush", "mspaint.exe"],
      command: "mspaint.exe",
      category: "creativity",
      description: "Simple graphics and drawing editor",
    },
    {
      id: "spotify",
      name: "Spotify",
      aliases: ["spotify", "music", "spotify player", "spotify.exe"],
      command: "spotify.exe",
      category: "media",
      description: "Digital streaming music and podcast player",
      webFallbackUrl: "https://open.spotify.com",
    },
    {
      id: "discord",
      name: "Discord",
      aliases: ["discord", "discord chat", "discord.exe"],
      command: "discord.exe",
      category: "communication",
      description: "Voice, video, and text communication platform",
      webFallbackUrl: "https://discord.com/app",
    },
  ];
}

// 1. Security check: Blocks shutdown, restart, delete, and admin commands
export function evaluateSecurity(textOrCommand: string): SecurityCheckResult {
  const normalized = (textOrCommand || "").toLowerCase().trim();

  for (const danger of DANGEROUS_PATTERNS) {
    if (danger.regex.test(normalized)) {
      return {
        isBlocked: true,
        blockReason: danger.description,
        matchedDangerPattern: danger.regex.source,
      };
    }
  }

  return { isBlocked: false };
}

// 2. Allow-list verification: Unknown apps are strictly rejected
export function matchAllowedApp(appNameOrQuery: string): AppMatchResult {
  const query = (appNameOrQuery || "").toLowerCase().trim();
  const apps = loadAllowedApps();

  if (!query) {
    return {
      isAllowed: false,
      reason: "No target application specified.",
      suggestedApps: apps.slice(0, 5).map((a) => a.name),
    };
  }

  // Exact or alias match
  for (const app of apps) {
    if (app.id.toLowerCase() === query || app.name.toLowerCase() === query) {
      return { isAllowed: true, app };
    }
    for (const alias of app.aliases) {
      if (alias.toLowerCase() === query) {
        return { isAllowed: true, app };
      }
    }
  }

  // Substring or keyword match
  for (const app of apps) {
    for (const alias of app.aliases) {
      if (query.includes(alias.toLowerCase()) || alias.toLowerCase().includes(query)) {
        return { isAllowed: true, app };
      }
    }
  }

  // Not in allow-list: Unknown app rejected
  return {
    isAllowed: false,
    reason: `Application '${appNameOrQuery}' is not in the authorized desktop allow-list. Unrecognized or untrusted executables are blocked for PC safety.`,
    suggestedApps: apps.slice(0, 6).map((a) => a.name),
  };
}
