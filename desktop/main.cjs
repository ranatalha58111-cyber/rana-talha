const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { launchDesktopApp, loadAllowList, checkDangerousCommand } = require('./appLauncher.cjs');

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 800,
    minHeight: 600,
    title: 'JARVIS AI Assistant - Windows Desktop',
    backgroundColor: '#080d1a',
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load URL or local build
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// System tray and global shortcuts
app.whenReady().then(() => {
  createWindow();

  // Register global hotkey to bring JARVIS to focus (Win/Ctrl + Shift + J)
  globalShortcut.register('CommandOrControl+Shift+J', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Launch authorized application on Real Windows PC
ipcMain.handle('launch-desktop-app', async (event, appNameOrTarget) => {
  console.log('[Electron IPC] Launch request:', appNameOrTarget);
  return await launchDesktopApp(appNameOrTarget);
});

// IPC: Open external URL in default browser (YouTube, Spotify Web, etc.)
ipcMain.handle('open-external-url', async (event, url) => {
  console.log('[Electron IPC] Open URL request:', url);
  try {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
      return { success: true, url };
    }
    return { success: false, error: 'Invalid URL scheme' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Scroll screen or page
ipcMain.handle('scroll-screen', async (event, { direction, amount }) => {
  console.log('[Electron IPC] Scroll request:', direction, amount);
  if (mainWindow && mainWindow.webContents) {
    const delta = direction === 'up' ? -(amount || 500) : (amount || 500);
    mainWindow.webContents.send('execute-scroll', { delta, direction, amount });
  }
  return { success: true, direction, amount };
});

// IPC: Control media playback
ipcMain.handle('control-media', async (event, { action, service }) => {
  console.log('[Electron IPC] Media control request:', action, service);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('execute-media-control', { action, service });
  }
  return { success: true, action, service };
});

// IPC: Retrieve authorized apps allow-list
ipcMain.handle('get-allowed-apps', async () => {
  return loadAllowList();
});

// Backward-compatible IPC execution handler with strict allow-list security
ipcMain.handle('execute-system-command', async (event, command) => {
  console.log('[Electron IPC] execute-system-command received:', command);
  return await launchDesktopApp(command);
});

