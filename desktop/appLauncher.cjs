const { spawn } = require('child_process');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Security Barrier: Strictly blocked danger patterns
const DANGEROUS_PATTERNS = [
  /\b(shutdown|reboot|restart-computer|stop-computer|poweroff|halt|init\s+[06])\b/i,
  /\b(del\b|rmdir\b|erase\b|rm\s+-rf|format\b|remove-item\b|diskpart|cipher\s+\/w|cleanmgr)\b/i,
  /\b(net\s+user|net\s+localgroup|runas|takeown|icacls|reg\s+add|reg\s+delete|bcdedit|vssadmin)\b/i,
  /\b(taskkill\s+\/f\s+\/im\s+(svchost|csrss|lsass|explorer|winlogon)|taskkill\s+\/f\s+\/pid\s+4)\b/i,
  /\b(invoke-expression|iex\b|downloadstring|start-process\s+-verb\s+runas)\b/i,
];

function getAllowListPath() {
  return path.join(__dirname, 'allowList.json');
}

function loadAllowList() {
  try {
    const listPath = getAllowListPath();
    if (fs.existsSync(listPath)) {
      const raw = fs.readFileSync(listPath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.apps)) {
        return data.apps;
      }
    }
  } catch (err) {
    console.error('[Electron AppLauncher] Error loading allowList.json:', err);
  }

  // Built-in fallback allow-list
  return [
    { id: 'notepad', name: 'Notepad', aliases: ['notepad', 'text editor'], command: 'notepad.exe', category: 'productivity' },
    { id: 'calculator', name: 'Calculator', aliases: ['calculator', 'calc'], command: 'calc.exe', category: 'utilities' },
    { id: 'chrome', name: 'Google Chrome', aliases: ['chrome', 'google chrome', 'browser'], command: 'chrome.exe', category: 'browsers' },
    { id: 'edge', name: 'Microsoft Edge', aliases: ['edge', 'microsoft edge', 'msedge'], command: 'msedge.exe', category: 'browsers' },
    { id: 'vscode', name: 'Visual Studio Code', aliases: ['vscode', 'vs code', 'code'], command: 'code', category: 'development' },
    { id: 'explorer', name: 'File Explorer', aliases: ['explorer', 'file explorer', 'files', 'folder'], command: 'explorer.exe', category: 'system' },
    { id: 'terminal', name: 'Windows Terminal', aliases: ['terminal', 'wt'], command: 'wt.exe', category: 'utilities' },
    { id: 'cmd', name: 'Command Prompt', aliases: ['cmd', 'command prompt'], command: 'cmd.exe', category: 'utilities' },
    { id: 'paint', name: 'Paint', aliases: ['paint', 'mspaint'], command: 'mspaint.exe', category: 'creativity' },
    { id: 'taskmgr', name: 'Task Manager', aliases: ['taskmgr', 'task manager'], command: 'taskmgr.exe', category: 'system' },
    { id: 'spotify', name: 'Spotify', aliases: ['spotify', 'music'], command: 'spotify.exe', category: 'media' },
  ];
}

function checkDangerousCommand(commandStr) {
  const normalized = (commandStr || '').toLowerCase();
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isBlocked: true,
        reason: 'CRITICAL SECURITY BARRIER: System shutdown, restart, file deletion, and elevated administrative commands are strictly prohibited.',
      };
    }
  }
  return { isBlocked: false };
}

function matchAppInAllowList(query) {
  const apps = loadAllowList();
  const q = (query || '').toLowerCase().trim();

  // Exact or alias match
  for (const app of apps) {
    if (app.id.toLowerCase() === q || app.name.toLowerCase() === q) {
      return { found: true, app };
    }
    if (Array.isArray(app.aliases)) {
      for (const alias of app.aliases) {
        if (alias.toLowerCase() === q) {
          return { found: true, app };
        }
      }
    }
  }

  // Substring match
  for (const app of apps) {
    if (Array.isArray(app.aliases)) {
      for (const alias of app.aliases) {
        if (q.includes(alias.toLowerCase()) || alias.toLowerCase().includes(q)) {
          return { found: true, app };
        }
      }
    }
  }

  return { found: false, available: apps.map((a) => a.name) };
}

/**
 * Launch an authorized application on real Windows PC
 */
async function launchDesktopApp(appNameOrTarget) {
  const target = String(appNameOrTarget || '').trim();

  // 1. Security check
  const sec = checkDangerousCommand(target);
  if (sec.isBlocked) {
    return {
      success: false,
      blocked: true,
      error: sec.reason,
    };
  }

  // 2. Allow-list check: Unknown apps are rejected
  const match = matchAppInAllowList(target);
  if (!match.found || !match.app) {
    return {
      success: false,
      rejected: true,
      error: `Application '${target}' is NOT in the authorized desktop allow-list. Unrecognized executables are rejected to protect your PC.`,
      availableApps: match.available || [],
    };
  }

  const app = match.app;

  // 3. Execution on Real PC
  try {
    // Windows settings or protocol URL
    if (app.command.startsWith('start ms-settings:') || app.command.startsWith('ms-settings:')) {
      shell.openExternal('ms-settings:');
      return {
        success: true,
        app: app.name,
        message: `Opened ${app.name} on your PC.`,
      };
    }

    // Direct Browser / Web Apps (e.g. YouTube, Spotify Web)
    if (app.command.startsWith('start http://') || app.command.startsWith('start https://')) {
      const targetUrl = app.command.replace(/^start\s+/, '');
      shell.openExternal(targetUrl);
      return {
        success: true,
        app: app.name,
        url: targetUrl,
        message: `Opened ${app.name} in browser on your PC.`,
      };
    }

    // Windows native process spawn (detached from Electron)
    const child = spawn(app.command, [], {
      detached: true,
      stdio: 'ignore',
      shell: true,
      windowsHide: false,
    });

    child.on('error', (err) => {
      console.warn(`[Electron AppLauncher] Error spawning ${app.name}:`, err.message);
    });

    // Unreference so child process runs independently even if JARVIS is minimized or closed
    child.unref();

    return {
      success: true,
      app: app.name,
      executable: app.command,
      message: `Launched ${app.name} successfully on Windows desktop.`,
    };
  } catch (err) {
    console.error(`[Electron AppLauncher] Failed to launch ${app.name}:`, err);
    return {
      success: false,
      error: `Could not launch ${app.name}: ${err.message}. Ensure the application is installed on this PC.`,
      webFallbackUrl: app.webFallbackUrl || null,
    };
  }
}

module.exports = {
  loadAllowList,
  launchDesktopApp,
  checkDangerousCommand,
  matchAppInAllowList,
};
