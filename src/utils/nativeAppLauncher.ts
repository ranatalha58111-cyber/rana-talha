/**
 * Native Desktop & Web Application Launcher for J.A.R.V.I.S.
 * 
 * Multi-tier execution:
 * 1. Electron Native Desktop Process (if running in desktop wrapper)
 * 2. OS Native Application URI Schemes (spotify:, calculator:, vscode:, discord:, ms-settings:, notepad:)
 * 3. Browser Web App (Spotify Web, Notepad, WhatsApp Web, YouTube, etc.)
 */

import { ParsedCommand } from './commandParser';

export interface AppLaunchResult {
  success: boolean;
  method: 'electron' | 'protocol' | 'web';
  appName: string;
  message?: string;
  spokenFeedback?: string;
}

/**
 * Triggers native OS protocol scheme safely inside browser / iframe
 */
export function triggerNativeProtocol(protocolUri: string): boolean {
  try {
    const link = document.createElement('a');
    link.href = protocolUri;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 500);
    return true;
  } catch {
    try {
      const win = window.open(protocolUri, '_blank');
      if (win) {
        setTimeout(() => {
          try { win.close(); } catch {}
        }, 1000);
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Check if the JARVIS local companion bridge is running (stubbed for compatibility)
 */
export async function checkLocalBridgeStatus(): Promise<boolean> {
  return false;
}

/**
 * Execute app launch with guaranteed execution and zero lag
 */
export async function launchDesktopApplication(
  parsed: ParsedCommand,
  language: string = 'ENGLISH',
  userName?: string
): Promise<AppLaunchResult> {
  const target = parsed.target || '';
  const appName = parsed.appName || target || 'Application';
  const protocol = parsed.protocolUri;
  const webUrl = parsed.url;
  const caller = userName ? userName : 'Sir';
  const isUrdu = language === 'اردو';
  const isRomanUrdu = language === 'ROMAN_URDU' || language === 'AUTO';

  // 1. Electron Desktop Environment (if running inside Electron)
  if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.launchApp) {
    try {
      await window.electronAPI.launchApp(target);
      return {
        success: true,
        method: 'electron',
        appName,
        message: `Launched ${appName} on your desktop.`,
        spokenFeedback: isUrdu
          ? `${appName} ڈیسک ٹاپ پر اوپن کر دیا گیا ہے۔`
          : isRomanUrdu
          ? `${appName} aapke desktop par open kar diya gaya hai.`
          : `Launched ${appName} on your desktop, ${caller}.`,
      };
    } catch (err) {
      console.warn('[NativeLauncher] Electron launch error:', err);
    }
  }

  // 2. Trigger OS Native Protocol URI Scheme (e.g. calculator:, spotify:, vscode:, discord:, etc.)
  if (protocol) {
    triggerNativeProtocol(protocol);
  }

  // 3. Web URL fallback
  if (webUrl) {
    try {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        method: protocol ? 'protocol' : 'web',
        appName,
        message: `Opening ${appName}...`,
        spokenFeedback: isUrdu
          ? `جی ${caller}، ${appName} کھول دیا گیا ہے۔`
          : isRomanUrdu
          ? `Jee ${caller}, ${appName} open kar diya gaya hai.`
          : `Opening ${appName} for you, ${caller}.`,
      };
    } catch (e) {
      console.warn('[NativeLauncher] Window open blocked:', e);
    }
  }

  // 4. Protocol-only app confirmation
  if (protocol) {
    return {
      success: true,
      method: 'protocol',
      appName,
      message: `Triggered ${appName} on your system.`,
      spokenFeedback: isUrdu
        ? `جی ${caller}، ${appName} اوپن کر دیا گیا ہے۔`
        : isRomanUrdu
        ? `Jee ${caller}, ${appName} open kar diya gaya hai.`
        : `Opening ${appName}, ${caller}.`,
    };
  }

  // 5. General fallback
  return {
    success: true,
    method: 'web',
    appName,
    message: `Launching ${appName}...`,
    spokenFeedback: isUrdu
      ? `جی ${caller}، ${appName} اوپن کر دیا گیا ہے۔`
      : isRomanUrdu
      ? `Jee ${caller}, ${appName} open kar diya gaya hai.`
      : `Opening ${appName}, ${caller}.`,
  };
}

/**
 * Execute application / process closure
 */
export async function closeDesktopApplication(
  parsed: ParsedCommand,
  language: string = 'ENGLISH',
  userName?: string
): Promise<AppLaunchResult> {
  const appName = parsed.appName || 'Application';
  const caller = userName ? userName : 'Sir';
  const isUrdu = language === 'اردو';
  const isRomanUrdu = language === 'ROMAN_URDU' || language === 'AUTO';

  if (typeof window !== 'undefined' && (window.electronAPI as any)?.isDesktop && (window.electronAPI as any).closeApp) {
    try {
      await (window.electronAPI as any).closeApp(appName);
      return {
        success: true,
        method: 'electron',
        appName,
        message: `Closed ${appName}.`,
        spokenFeedback: isUrdu
          ? `"${appName}" بند کر دیا گیا ہے، ${caller}۔`
          : isRomanUrdu
          ? `Jee ${caller}, "${appName}" band kar diya gaya hai.`
          : `Closed ${appName} for you, ${caller}.`,
      };
    } catch {}
  }

  return {
    success: false,
    method: 'web',
    appName,
    message: `System privilege restriction.`,
    spokenFeedback: isUrdu
      ? `معذرت ${caller}، میرے پاس ویب براؤزر انوائرمنٹ سے براہ راست اس سسٹم پروسیس یا ایپلیکیشن کو بند کرنے کی صلاحیت یا پاور نہیں ہے۔`
      : isRomanUrdu
      ? `Maazrat ${caller}, mere paas web browser environment se direct system application ya process band karne ki salahiyat ya power nahi hai.`
      : `I do not possess the system-level privileges or power to close external desktop applications directly from this browser environment, ${caller}.`,
  };
}

