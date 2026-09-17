import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";
import { evaluateSecurity, matchAllowedApp } from "./appAllowList";

/**
 * 1. LAUNCH APPLICATION TOOL
 * Can open local Windows applications (Chrome, Edge, Discord, Spotify, Notepad, Calculator, VS Code, etc.)
 * as well as web applications (YouTube, Spotify Web, or URLs).
 */
export const launchApplicationTool: JarvisToolDefinition = {
  id: "tool-launch-application",
  name: "launch_application",
  displayName: "Application & Web Launcher",
  version: "2.5.0",
  category: "system",
  enabled: true,
  description:
    "Launch or open a verified local PC application (Google Chrome, Microsoft Edge, Discord, Spotify, Notepad, Calculator, VS Code, File Explorer, Terminal) or web destination (YouTube, Spotify Web, or any URL) on user's computer.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      app_name: {
        type: Type.STRING,
        description:
          "Name or keyword of the application or website to open (e.g. 'youtube', 'chrome', 'edge', 'discord', 'spotify', 'notepad', 'calculator', 'vscode', etc.).",
      },
      target_url: {
        type: Type.STRING,
        description: "Optional specific web URL if opening a custom website or video link.",
      },
    },
    required: ["app_name"],
  },
  execute: (args) => {
    const rawTarget = String(args?.app_name || args?.target || "").trim();
    const targetUrl = String(args?.target_url || "").trim();
    const query = rawTarget.toLowerCase();

    // 1. HARD SECURITY BARRIER: Block shutdown, restart, file deletion, and admin privilege escalation
    const securityCheck = evaluateSecurity(`${rawTarget} ${targetUrl}`);
    if (securityCheck.isBlocked) {
      return {
        result: {
          status: "SECURITY_BLOCKED",
          isBlocked: true,
          target: rawTarget,
          reason: securityCheck.blockReason,
          message: `[SECURITY ALERT] Action Blocked: ${securityCheck.blockReason}`,
        },
        sideEffect: {
          type: "SECURITY_BLOCKED",
          target: rawTarget,
          reason: securityCheck.blockReason,
        },
      };
    }

    // 2. SPECIAL DIRECT WEB APPS: YouTube
    if (query === "youtube" || query === "yt" || query.includes("youtube.com") || rawTarget.includes("youtube.com")) {
      const url = targetUrl || (rawTarget.startsWith("http") ? rawTarget : "https://www.youtube.com");
      return {
        result: {
          status: "SUCCESS",
          type: "WEB_APPLICATION",
          app: "YouTube",
          url,
          message: `YouTube open kar diya gaya hai, Sir.`,
        },
        sideEffect: {
          type: "URL_OPEN",
          url,
          target: "YouTube",
        },
      };
    }

    // 3. SPECIAL DIRECT WEB APPS: Spotify Web Player
    if (query === "spotify web" || query === "spotify browser" || query === "spotify online") {
      const url = "https://open.spotify.com";
      return {
        result: {
          status: "SUCCESS",
          type: "WEB_APPLICATION",
          app: "Spotify Web Player",
          url,
          message: `Spotify Web Player browser mein open kar diya gaya hai, Sir.`,
        },
        sideEffect: {
          type: "URL_OPEN",
          url,
          target: "Spotify Web",
        },
      };
    }

    // 4. DIRECT HTTP/HTTPS URL
    if (rawTarget.startsWith("http://") || rawTarget.startsWith("https://") || targetUrl) {
      const url = targetUrl || rawTarget;
      return {
        result: {
          status: "SUCCESS",
          type: "WEB_URL",
          url,
          message: `Website link open kar di gayi hai, Sir: ${url}`,
        },
        sideEffect: {
          type: "URL_OPEN",
          url,
        },
      };
    }

    // 5. LOCAL PC APPLICATIONS (Chrome, Edge, Discord, Spotify, Notepad, Calculator, VS Code, etc.)
    const match = matchAllowedApp(rawTarget);

    if (!match.isAllowed || !match.app) {
      return {
        result: {
          status: "REJECTED_UNKNOWN_APP",
          isAllowed: false,
          target: rawTarget,
          reason: match.reason,
          suggestedApps: match.suggestedApps || [],
          message: `Sir, application '${rawTarget}' allow-list mein registered nahi hai. Security policy ke tehat anjan software launch nahi ho sakta.`,
        },
        sideEffect: {
          type: "APP_REJECTED",
          target: rawTarget,
          reason: match.reason,
        },
      };
    }

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
        message: `${app.name} PC par launch kar di gayi hai, Sir.`,
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
      },
    };
  },
};

/**
 * 2. SCROLL SCREEN TOOL
 * Scrolls the active screen or window up or down.
 */
export const scrollScreenTool: JarvisToolDefinition = {
  id: "tool-scroll-screen",
  name: "scroll_screen",
  displayName: "Screen & Window Scroller",
  version: "1.5.0",
  category: "system",
  enabled: true,
  description:
    "Scroll the user's active screen, window, or web page up or down (e.g. 'scroll down', 'neeche jao', 'scroll up', 'ooper jao').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      direction: {
        type: Type.STRING,
        description: "Direction to scroll: 'down', 'up', 'top', or 'bottom'.",
      },
      amount: {
        type: Type.INTEGER,
        description: "Optional scroll distance in pixels or steps (default: 500).",
      },
    },
    required: ["direction"],
  },
  execute: (args) => {
    const rawDir = String(args?.direction || "down").toLowerCase().trim();
    const direction = ["up", "top"].includes(rawDir)
      ? "up"
      : ["down", "bottom"].includes(rawDir)
      ? "down"
      : "down";
    const amount = Number(args?.amount) || (rawDir === "top" || rawDir === "bottom" ? 2000 : 500);

    return {
      result: {
        status: "SUCCESS",
        direction,
        amount,
        message: `Screen ${direction === "down" ? "neeche" : "ooper"} scroll kar di gayi hai, Boss.`,
      },
      sideEffect: {
        type: "SCREEN_SCROLL",
        direction,
        amount,
      },
    };
  },
};

/**
 * 3. CONTROL MEDIA TOOL
 * Controls playback of media (play, pause, next, previous, stop, volume up, volume down, mute).
 */
export const controlMediaTool: JarvisToolDefinition = {
  id: "tool-control-media",
  name: "control_media",
  displayName: "Media & Audio Controller",
  version: "1.5.0",
  category: "system",
  enabled: true,
  description:
    "Control media and music playback on the PC (play, pause, next track, previous track, stop, volume_up, volume_down, mute).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description:
          "The media action: 'pause', 'play', 'next', 'previous', 'stop', 'volume_up', 'volume_down', 'mute'.",
      },
      service: {
        type: Type.STRING,
        description: "Optional media service target: 'spotify', 'youtube', or 'system'.",
      },
    },
    required: ["action"],
  },
  execute: (args) => {
    const action = String(args?.action || "pause").toLowerCase().trim();
    const service = String(args?.service || "system").toLowerCase().trim();

    let confirmationMsg = "Media command execute kar di gayi hai, Sir.";
    if (action === "pause" || action === "stop") {
      confirmationMsg = "Gana rok diya gaya hai, Sir.";
    } else if (action === "play" || action === "resume") {
      confirmationMsg = "Gana resume / play kar diya gaya hai, Sir.";
    } else if (action === "next") {
      confirmationMsg = "Next track play kar diya hai, Sir.";
    } else if (action === "previous") {
      confirmationMsg = "Previous track par switch kar diya hai, Sir.";
    } else if (action.includes("volume")) {
      confirmationMsg = `Volume adjust kar diya gaya hai, Sir (${action}).`;
    }

    return {
      result: {
        status: "SUCCESS",
        action,
        service,
        message: confirmationMsg,
      },
      sideEffect: {
        type: "MEDIA_CONTROL",
        action,
        service,
      },
    };
  },
};
