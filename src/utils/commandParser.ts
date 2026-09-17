/**
 * Safe Command Recognition & Execution for JARVIS
 * Supports English, Urdu, and Roman Urdu commands.
 * Strictly enforces allowlist and blocks dangerous system commands.
 */

export interface ParsedCommand {
  isCommand: boolean;
  type?: 'APP_LAUNCH' | 'URL_OPEN' | 'SCREEN_SCROLL' | 'MEDIA_CONTROL' | 'SECURITY_BLOCKED' | 'UNAUTHORIZED' | 'FAST_CHAT' | 'CLOSE_APP' | 'APP_CLOSE';
  target?: string;
  url?: string;
  protocolUri?: string;
  direction?: 'up' | 'down' | 'top' | 'bottom';
  amount?: number;
  action?: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'mute';
  appName?: string;
  spokenReply?: string;
  isDangerous?: boolean;
}

// Strict list of authorized apps with native OS protocol schemes for direct PC launching
const AUTHORIZED_APPS: Record<string, { id: string; name: string; command: string; protocolUri?: string; webFallbackUrl?: string }> = {
  chrome: {
    id: 'chrome',
    name: 'Google Chrome',
    command: 'chrome.exe',
    webFallbackUrl: 'https://www.google.com',
  },
  edge: {
    id: 'edge',
    name: 'Microsoft Edge',
    command: 'msedge.exe',
    protocolUri: 'microsoft-edge:',
    webFallbackUrl: 'https://www.bing.com',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax AI',
    command: 'minimax',
    webFallbackUrl: 'https://www.minimax.io',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor Code Editor',
    command: 'cursor',
    protocolUri: 'cursor:',
    webFallbackUrl: 'https://www.cursor.com',
  },
  vscode: {
    id: 'vscode',
    name: 'Visual Studio Code',
    command: 'code',
    protocolUri: 'vscode:',
    webFallbackUrl: 'https://vscode.dev',
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    command: 'spotify.exe',
    protocolUri: 'spotify:',
    webFallbackUrl: 'https://open.spotify.com',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    command: 'discord.exe',
    protocolUri: 'discord:',
    webFallbackUrl: 'https://discord.com/app',
  },
  notepad: {
    id: 'notepad',
    name: 'Notepad',
    command: 'notepad.exe',
    protocolUri: 'notepad:',
    webFallbackUrl: 'https://notepad.js.org',
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    command: 'calc.exe',
    protocolUri: 'calculator:',
    webFallbackUrl: 'https://www.google.com/search?q=calculator',
  },
  explorer: {
    id: 'explorer',
    name: 'File Explorer',
    command: 'explorer.exe',
    webFallbackUrl: 'https://onedrive.live.com',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    command: 'whatsapp.exe',
    protocolUri: 'whatsapp:',
    webFallbackUrl: 'https://web.whatsapp.com',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    command: 'telegram.exe',
    protocolUri: 'tg:',
    webFallbackUrl: 'https://web.telegram.org',
  },
  steam: {
    id: 'steam',
    name: 'Steam',
    command: 'steam.exe',
    protocolUri: 'steam:',
  },
  paint: {
    id: 'paint',
    name: 'Paint',
    command: 'mspaint.exe',
    protocolUri: 'ms-paint:',
  },
  settings: {
    id: 'settings',
    name: 'Windows Settings',
    command: 'ms-settings:',
    protocolUri: 'ms-settings:',
  },
  clock: {
    id: 'clock',
    name: 'Clock & Alarms',
    command: 'ms-clock:',
    protocolUri: 'ms-clock:',
  },
  store: {
    id: 'store',
    name: 'Microsoft Store',
    command: 'ms-windows-store:',
    protocolUri: 'ms-windows-store:',
  },
  terminal: {
    id: 'terminal',
    name: 'Windows Terminal',
    command: 'wt.exe',
  },
};

// Dangerous pattern check
const DANGEROUS_PATTERNS = [
  /\b(shutdown|reboot|restart-computer|poweroff|halt)\b/i,
  /\b(format|diskpart|rmdir|erase|del\s+\/[sfq]|rm\s+-rf)\b/i,
  /\b(reg\s+add|reg\s+delete|registry|takeown|icacls|net\s+user)\b/i,
  /\b(taskkill\s+\/f\s+\/im\s+(svchost|csrss|lsass|explorer|winlogon))\b/i,
];

export function parseJarvisCommand(
  input: string,
  language: string = 'ENGLISH',
  userName?: string
): ParsedCommand {
  const text = input.trim();
  // Strip wake-words & prefixes like "jarvis yeh kaam karo", "yehkam tokarejana", "jarvis yeh kaam kar do", etc.
  const cleanedText = text
    .replace(/^(?:hey\s+|hi\s+|ok\s+|suno\s+|oye\s+)?(?:jarvis|gravis|garvis)\s*/i, '')
    .replace(/^(?:yeh\s*kam|yeh\s*kaam|ye\s*kam|ye\s*kaam)\s*(?:to\s*)?(?:kare|karejana|karo|kardo|kar\s*do|karna)\s*/i, '')
    .replace(/^(?:kaam\s+karo|akm\s+karo|yeh\s+akm\s+karo)\s*/i, '')
    .trim();
  const lower = (cleanedText || text).toLowerCase();
  const isUrdu = language === 'اردو';
  const isRomanUrdu =
    language === 'ROMAN_URDU' ||
    (language === 'AUTO' &&
      /\b(kholo|chalao|lagao|band\s+karo|roko|suno|karo|batao|dhundo|search\s+karo|kaisa|kaise|kya|kyun|mera|meri|mujhe|hukm|shukriya|hazir|neeche|ooper|upar|gana|gaana|chahiye|karo|bhai|sahab)\b/i.test(lower)) ||
    (!isUrdu && language !== 'ENGLISH' && /\b(kholo|chalao|lagao|band|roko|gana|neeche|ooper|upar)\b/i.test(lower));

  const callerName = userName ? userName : '';
  const formalUrduName = callerName ? `${callerName} صاحب` : 'سر';
  const romanName = callerName ? callerName : 'Sir';

  // Helper for natural personalized spoken replies
  const buildAppOpenReply = (appDisplayName: string, urduName: string) => {
    if (isUrdu) {
      return callerName
        ? `جی ${callerName}، ${urduName} اوپن کر دیا گیا ہے۔`
        : `${urduName} اوپن کر دیا گیا ہے، سر۔`;
    }
    if (isRomanUrdu) {
      return `Jee ${romanName}, ${appDisplayName} open kar diya gaya hai.`;
    }
    return callerName
      ? `I opened ${appDisplayName} for you, ${callerName}.`
      : `Opening ${appDisplayName}, sir.`;
  };

  // 1. Check dangerous system commands
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isCommand: true,
        type: 'SECURITY_BLOCKED',
        isDangerous: true,
        spokenReply: isUrdu
          ? (callerName
              ? `سیکورٹی پالیسی کے تحت سسٹم کمانڈز بلاک ہیں، ${formalUrduName}۔`
              : 'سیکورٹی پالیسی کے تحت سسٹم کو نقصان پہنچانے والی کمانڈز بلاک ہیں۔')
          : isRomanUrdu
          ? `Maazrat ${romanName}, system security policy ke tehat yeh command block hai.`
          : (callerName
              ? `Access denied, ${callerName}. Destructive system operations are strictly blocked.`
              : 'Access denied. Destructive system operations and administrative alterations are strictly blocked.'),
      };
    }
  }

  // CLOSE / STOP / TERMINATE APP COMMANDS (e.g. "close Spotify", "Spotify band karo", "close Chrome")
  const closeAppMatch =
    lower.match(/\b(?:close|band\s+karo|stop|exit|shut\s+down)\s+([a-zA-Z0-9_\-\s]+)\b/i) ||
    lower.match(/\b([a-zA-Z0-9_\-]+)\s+(?:band\s+karo|close)\b/i);

  if (closeAppMatch && closeAppMatch[1]) {
    const targetApp = closeAppMatch[1].trim().toLowerCase();
    if (!targetApp.includes('jarvis') && !targetApp.includes('system') && targetApp.length > 1) {
      return {
        isCommand: true,
        type: 'CLOSE_APP',
        appName: targetApp,
        spokenReply: isUrdu
          ? `${targetApp} بند کیا جا رہا ہے، ${formalUrduName}۔`
          : isRomanUrdu
          ? `Jee ${romanName}, ${targetApp} band kiya ja raha hai.`
          : `Closing ${targetApp}, sir.`,
      };
    }
  }

  // 1b. Download JARVIS Desktop Shortcut
  if (lower.match(/\b(?:download\s+shortcut|shortcut\s+download|desktop\s+shortcut)\b/i)) {
    return {
      isCommand: true,
      type: 'URL_OPEN',
      url: '/api/download/shortcut',
      target: 'JARVIS Desktop Shortcut',
      spokenReply: isUrdu
        ? `جارویس ڈیسک ٹاپ شارٹ کٹ ڈاؤنلوڈ کیا جا رہا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, JARVIS Desktop Shortcut download kiya ja raha hai. Is file ko chalate hi desktop par icon ban jayega.`
        : 'Downloading JARVIS 1-Click Desktop Shortcut, sir.',
    };
  }

  // 1c. Download JARVIS Local Bridge package
  if (lower.match(/\b(?:download\s+bridge|bridge\s+download|local\s+bridge)\b/i)) {
    return {
      isCommand: true,
      type: 'URL_OPEN',
      url: '/api/download/bridge',
      target: 'JARVIS Local Bridge Package',
      spokenReply: isUrdu
        ? `لوکل برج پیکج ڈاؤنلوڈ کیا جا رہا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, JARVIS Local Bridge download ho raha hai. Is se aapke PC ki tamam desktop apps control hongi.`
        : 'Downloading JARVIS Local Bridge package, sir.',
    };
  }

  // 1d. Download JARVIS Full Package command
  if (
    lower.match(/\b(download\s+(?:jarvis|background|daemon|listener|app|client)|jarvis\s+download|download\s+karo)\b/i)
  ) {
    return {
      isCommand: true,
      type: 'URL_OPEN',
      url: '/api/download/jarvis-package',
      target: 'JARVIS Background Listener Package',
      spokenReply: isUrdu
        ? `جاروس بیک گراؤنڈ لسنگ پیکج ڈاؤنلوڈ کیا جا رہا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, JARVIS background listener package download kiya ja raha hai.`
        : callerName
        ? `Downloading JARVIS background listener package for you, ${callerName}.`
        : 'Downloading JARVIS background listener package, sir. It will listen 24/7 in your PC background for "Jarvis yeh kaam karo".',
    };
  }

  // 2. YouTube play / search (e.g. "play Believer on YouTube", "YouTube par Arijit Singh chalao", "search YouTube for GTA 6")
  const ytPlayMatch =
    lower.match(/(?:play|chalao|lagao|suno)\s+(.+?)\s+(?:on\s+youtube|youtube\s+par|youtube\s+pe)/i) ||
    lower.match(/youtube\s+(?:pe|par)\s+(.+?)\s+(?:chalao|play|lagao|suno|search\s+karo|bajao)/i) ||
    lower.match(/(?:search\s+youtube\s+for|search\s+on\s+youtube|youtube\s+par\s+search\s+karo)\s+(.+)/i) ||
    lower.match(/(?:play|chalao|lagao)\s+(.+?)\s+(?:video|song|gaana|gana)\b/i);

  if (ytPlayMatch && ytPlayMatch[1]) {
    const query = ytPlayMatch[1].replace(/^(?:gana|gaana|song|video)\s*/i, '').trim();
    if (query && query.length > 1 && !query.includes('spotify')) {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      return {
        isCommand: true,
        type: 'URL_OPEN',
        url,
        target: 'YouTube Search',
        spokenReply: isUrdu
          ? `یوٹیوب پر "${query}" پلے کیا جا رہا ہے، ${formalUrduName}۔`
          : isRomanUrdu
          ? `Jee ${romanName}, YouTube par "${query}" play kiya ja raha hai.`
          : callerName
          ? `Playing "${query}" on YouTube for you, ${callerName}.`
          : `Playing "${query}" on YouTube, sir.`,
      };
    }
  }

  // 3. Open YouTube directly
  if (
    lower.match(/\b(open\s+youtube|launch\s+youtube|youtube\s+kholo|youtube\s+chalao|youtube\s+open)\b/i) ||
    lower === 'youtube'
  ) {
    return {
      isCommand: true,
      type: 'URL_OPEN',
      url: 'https://www.youtube.com',
      target: 'YouTube',
      spokenReply: isUrdu
        ? `جی ${callerName ? callerName : 'سر'}، یوٹیوب کھول دیا گیا ہے۔`
        : isRomanUrdu
        ? `Jee ${romanName}, YouTube open kar diya gaya hai.`
        : callerName
        ? `I opened YouTube for you, ${callerName}.`
        : 'Opening YouTube, sir.',
    };
  }

  // 4a. Spotify Search / Play Song (e.g. "play Starboy on Spotify", "Spotify par Atif Aslam chalao", "Spotify search")
  const spotifySearchMatch =
    lower.match(/(?:play|chalao|lagao|suno)\s+(.+?)\s+(?:on\s+spotify|spotify\s+par|spotify\s+pe)/i) ||
    lower.match(/spotify\s+(?:pe|par)\s+(.+?)\s+(?:chalao|play|lagao|suno|search\s+karo|bajao)/i) ||
    lower.match(/(?:search\s+spotify\s+for|search\s+on\s+spotify|spotify\s+par\s+search\s+karo)\s+(.+)/i);

  if (spotifySearchMatch && spotifySearchMatch[1]) {
    const songQuery = spotifySearchMatch[1].trim();
    const encoded = encodeURIComponent(songQuery);
    const spotifyWebUrl = `https://open.spotify.com/search/${encoded}`;
    const spotifyProtocolUri = `spotify:search:${encoded}`;

    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: `Spotify (${songQuery})`,
      target: AUTHORIZED_APPS.spotify.command,
      protocolUri: spotifyProtocolUri,
      url: spotifyWebUrl,
      spokenReply: isUrdu
        ? `اسپاٹیفائی پر "${songQuery}" پلے کیا جا رہا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, Spotify par "${songQuery}" search aur play kar diya gaya hai.`
        : callerName
        ? `Playing "${songQuery}" on Spotify for you, ${callerName}.`
        : `Playing "${songQuery}" on Spotify, sir.`,
    };
  }

  // 4b. Open Spotify Directly (Default)
  if (
    lower.includes('spotify')
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Spotify',
      target: AUTHORIZED_APPS.spotify.command,
      protocolUri: AUTHORIZED_APPS.spotify.protocolUri,
      url: AUTHORIZED_APPS.spotify.webFallbackUrl,
      spokenReply: buildAppOpenReply('Spotify', 'اسپاٹیفائی'),
    };
  }

  // 5. Open Chrome
  if (
    lower.match(/\b(open\s+chrome|launch\s+chrome|chrome\s+kholo|chrome\s+open|google\s+chrome)\b/i) ||
    lower === 'chrome'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Google Chrome',
      target: AUTHORIZED_APPS.chrome.command,
      url: AUTHORIZED_APPS.chrome.webFallbackUrl,
      spokenReply: buildAppOpenReply('Google Chrome', 'گوگل کروم'),
    };
  }

  // 6a. Edge Search (e.g. "edge par search karo Python tutorials", "search on edge for...")
  const edgeSearchMatch =
    lower.match(/(?:search\s+edge\s+for|search\s+on\s+edge|edge\s+par\s+search\s+karo)\s+(.+)/i) ||
    lower.match(/edge\s+(?:pe|par)\s+(.+?)\s+(?:search\s+karo|dhundo|talaash\s+karo)/i);

  if (edgeSearchMatch && edgeSearchMatch[1]) {
    const query = edgeSearchMatch[1].trim();
    const edgeSearchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: `Microsoft Edge (${query})`,
      target: AUTHORIZED_APPS.edge.command,
      protocolUri: `microsoft-edge:${edgeSearchUrl}`,
      url: edgeSearchUrl,
      spokenReply: isUrdu
        ? `مائیکروسافٹ ایج پر "${query}" سرچ کیا جا رہا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, Microsoft Edge par "${query}" search kiya ja raha hai.`
        : callerName
        ? `Searching for "${query}" on Microsoft Edge, ${callerName}.`
        : `Searching on Microsoft Edge, sir.`,
    };
  }

  // 6b. Open Edge (Default)
  if (
    lower.match(/\b(open\s+edge|launch\s+edge|edge\s+kholo|edge\s+open|microsoft\s+edge)\b/i) ||
    lower === 'edge'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Microsoft Edge',
      target: AUTHORIZED_APPS.edge.command,
      protocolUri: AUTHORIZED_APPS.edge.protocolUri,
      url: AUTHORIZED_APPS.edge.webFallbackUrl,
      spokenReply: buildAppOpenReply('Microsoft Edge', 'مائیکروسافٹ ایج'),
    };
  }

  // 6b. Open Minimax
  if (
    lower.match(/\b(open\s+minimax|launch\s+minimax|minimax\s+kholo|minimax\s+open)\b/i) ||
    lower === 'minimax' ||
    lower === 'mini max'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'MiniMax AI',
      target: AUTHORIZED_APPS.minimax.command,
      url: AUTHORIZED_APPS.minimax.webFallbackUrl,
      spokenReply: buildAppOpenReply('MiniMax AI', 'منی میکس اے آئی'),
    };
  }

  // 6c. Open Cursor Code Editor
  if (
    lower.match(/\b(open\s+cursor|launch\s+cursor|cursor\s+kholo|cursor\s+code|cursor\s+editor)\b/i) ||
    lower === 'cursor'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Cursor Code Editor',
      target: AUTHORIZED_APPS.cursor.command,
      protocolUri: AUTHORIZED_APPS.cursor.protocolUri,
      url: AUTHORIZED_APPS.cursor.webFallbackUrl,
      spokenReply: buildAppOpenReply('Cursor', 'کرسر کوڈ ایڈیٹر'),
    };
  }

  // 7. Open VS Code
  if (
    lower.match(/\b(open\s+vs\s*code|launch\s+vs\s*code|open\s+code|code\s+kholo|vscode\s+kholo|vs\s*code\s+open)\b/i) ||
    lower === 'vscode' ||
    lower === 'vs code'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Visual Studio Code',
      target: AUTHORIZED_APPS.vscode.command,
      protocolUri: AUTHORIZED_APPS.vscode.protocolUri,
      url: AUTHORIZED_APPS.vscode.webFallbackUrl,
      spokenReply: buildAppOpenReply('Visual Studio Code', 'ویژول اسٹوڈیو کوڈ'),
    };
  }

  // 8a. Discord Message Command (e.g. "discord par Ali ko bolo hello", "message Ali on discord saying meet me", "discord par Rana ko msg karo")
  const discordMsgMatch =
    lower.match(/(?:discord\s+par|discord\s+pe)\s+([a-zA-Z0-9_\-]+)\s+(?:ko\s+bolo|ko\s+kaho|ko\s+msg\s+karo|ko\s+message\s+karo|ko\s+bhejo)\s+(.+)/i) ||
    lower.match(/(?:message|msg|send\s+message\s+to|tell)\s+([a-zA-Z0-9_\-]+)\s+(?:on\s+discord|in\s+discord)\s+(?:saying\s+|that\s+)?(.+)/i) ||
    lower.match(/(?:discord\s+message|discord\s+msg)\s+([a-zA-Z0-9_\-]+)\s+(.+)/i);

  if (discordMsgMatch && discordMsgMatch[1] && discordMsgMatch[2]) {
    const contact = discordMsgMatch[1].trim();
    const msgContent = discordMsgMatch[2].trim();
    const discordWebUrl = 'https://discord.com/app';
    const discordProtocolUri = 'discord:';

    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: `Discord Message to ${contact}`,
      target: AUTHORIZED_APPS.discord.command,
      protocolUri: discordProtocolUri,
      url: discordWebUrl,
      spokenReply: isUrdu
        ? `ڈسکارڈ پر ${contact} کو میسج: "${msgContent}" بھیجنے کے لیے ڈسکارڈ اوپن کر دیا گیا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, Discord par ${contact} ko message "${msgContent}" send karne ke liye Discord open kar diya gaya hai.`
        : callerName
        ? `Opening Discord to send "${msgContent}" to ${contact}, ${callerName}.`
        : `Opening Discord to send message to ${contact}, sir.`,
    };
  }

  // 8b. Open Discord (Default)
  if (
    lower.match(/\b(open\s+discord|launch\s+discord|discord\s+kholo|discord\s+open)\b/i) ||
    lower === 'discord'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Discord',
      target: AUTHORIZED_APPS.discord.command,
      protocolUri: AUTHORIZED_APPS.discord.protocolUri,
      url: AUTHORIZED_APPS.discord.webFallbackUrl,
      spokenReply: buildAppOpenReply('Discord', 'ڈسکارڈ'),
    };
  }

  // 9. Open Notepad
  if (
    lower.match(/\b(open\s+notepad|launch\s+notepad|notepad\s+kholo|notepad\s+open)\b/i) ||
    lower === 'notepad'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Notepad',
      target: AUTHORIZED_APPS.notepad.command,
      protocolUri: AUTHORIZED_APPS.notepad.protocolUri,
      url: AUTHORIZED_APPS.notepad.webFallbackUrl,
      spokenReply: buildAppOpenReply('Notepad', 'نوٹ پیڈ'),
    };
  }

  // 10. Open Calculator
  if (
    lower.match(/\b(open\s+calculator|launch\s+calculator|calc\s+kholo|calculator\s+kholo|calculator\s+open)\b/i) ||
    lower === 'calculator' ||
    lower === 'calc'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Calculator',
      target: AUTHORIZED_APPS.calculator.command,
      protocolUri: AUTHORIZED_APPS.calculator.protocolUri,
      url: AUTHORIZED_APPS.calculator.webFallbackUrl,
      spokenReply: buildAppOpenReply('Calculator', 'کیلکولیٹر'),
    };
  }

  // 11. Open File Explorer
  if (
    lower.match(/\b(open\s+explorer|open\s+file\s+explorer|files\s+kholo|explorer\s+kholo|my\s+computer)\b/i) ||
    lower === 'explorer'
  ) {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'File Explorer',
      target: AUTHORIZED_APPS.explorer.command,
      url: AUTHORIZED_APPS.explorer.webFallbackUrl,
      spokenReply: buildAppOpenReply('File Explorer', 'فائل ایکسپلورر'),
    };
  }

  // 11b. WhatsApp Message Command (e.g. "whatsapp par Ali ko bolo hello", "whatsapp message Ali meet at 5", "whatsapp par Rana ko msg karo")
  const waMsgMatch =
    lower.match(/(?:whatsapp\s+par|whatsapp\s+pe)\s+([a-zA-Z0-9_\-]+)\s+(?:ko\s+bolo|ko\s+kaho|ko\s+msg\s+karo|ko\s+message\s+karo|ko\s+bhejo)\s+(.+)/i) ||
    lower.match(/(?:message|msg|send\s+message\s+to|tell)\s+([a-zA-Z0-9_\-]+)\s+(?:on\s+whatsapp)\s+(?:saying\s+|that\s+)?(.+)/i) ||
    lower.match(/(?:whatsapp\s+message|whatsapp\s+msg)\s+([a-zA-Z0-9_\-]+)\s+(.+)/i);

  if (waMsgMatch && waMsgMatch[1] && waMsgMatch[2]) {
    const contact = waMsgMatch[1].trim();
    const msgContent = waMsgMatch[2].trim();
    const waWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msgContent)}`;
    const waProtocolUri = `whatsapp://send?text=${encodeURIComponent(msgContent)}`;

    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: `WhatsApp Message to ${contact}`,
      target: AUTHORIZED_APPS.whatsapp.command,
      protocolUri: waProtocolUri,
      url: waWebUrl,
      spokenReply: isUrdu
        ? `واٹس ایپ پر ${contact} کو میسج: "${msgContent}" بھیجنے کے لیے واٹس ایپ اوپن کر دیا گیا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, WhatsApp par ${contact} ko message "${msgContent}" send karne ke liye WhatsApp open kar diya gaya hai.`
        : callerName
        ? `Opening WhatsApp to send "${msgContent}" to ${contact}, ${callerName}.`
        : `Opening WhatsApp to send message to ${contact}, sir.`,
    };
  }

  // 11c. Open WhatsApp (Default)
  if (lower.match(/\b(open\s+whatsapp|launch\s+whatsapp|whatsapp\s+kholo|whatsapp\s+open)\b/i) || lower === 'whatsapp') {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'WhatsApp',
      target: AUTHORIZED_APPS.whatsapp.command,
      protocolUri: AUTHORIZED_APPS.whatsapp.protocolUri,
      url: AUTHORIZED_APPS.whatsapp.webFallbackUrl,
      spokenReply: buildAppOpenReply('WhatsApp', 'واٹس ایپ'),
    };
  }

  // 11d. Open Telegram
  if (lower.match(/\b(open\s+telegram|launch\s+telegram|telegram\s+kholo|telegram\s+open)\b/i) || lower === 'telegram') {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Telegram',
      target: AUTHORIZED_APPS.telegram.command,
      protocolUri: AUTHORIZED_APPS.telegram.protocolUri,
      url: AUTHORIZED_APPS.telegram.webFallbackUrl,
      spokenReply: buildAppOpenReply('Telegram', 'ٹیلیگرام'),
    };
  }

  // 11d. Open Paint
  if (lower.match(/\b(open\s+paint|launch\s+paint|paint\s+kholo|mspaint\s+kholo)\b/i) || lower === 'paint') {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Paint',
      target: AUTHORIZED_APPS.paint.command,
      protocolUri: AUTHORIZED_APPS.paint.protocolUri,
      spokenReply: buildAppOpenReply('Paint', 'پینٹ'),
    };
  }

  // 11e. Open Settings
  if (lower.match(/\b(open\s+settings|launch\s+settings|settings\s+kholo|windows\s+settings)\b/i) || lower === 'settings') {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Windows Settings',
      target: AUTHORIZED_APPS.settings.command,
      protocolUri: AUTHORIZED_APPS.settings.protocolUri,
      spokenReply: buildAppOpenReply('Settings', 'سیٹنگز'),
    };
  }

  // 11f. Open Steam
  if (lower.match(/\b(open\s+steam|launch\s+steam|steam\s+kholo)\b/i) || lower === 'steam') {
    return {
      isCommand: true,
      type: 'APP_LAUNCH',
      appName: 'Steam',
      target: AUTHORIZED_APPS.steam.command,
      protocolUri: AUTHORIZED_APPS.steam.protocolUri,
      spokenReply: buildAppOpenReply('Steam', 'اسٹیم'),
    };
  }

  // 11.5 App Close / Stop / Band Karo (e.g. "Spotify band karo", "close Chrome", "YouTube band karo", "close app")
  const closeMatch =
    lower.match(/(?:band\s+karo|close|shut\s+down|stop|quit|exit)\s+(?:se\s+)?(?:ko\s+)?([a-zA-Z0-9_\-\s]+)/i) ||
    lower.match(/([a-zA-Z0-9_\-\s]+?)\s+(?:ko\s+)?(?:band\s+karo|close|stop|quit)/i);

  if (closeMatch && closeMatch[1]) {
    const targetApp = closeMatch[1].replace(/^(?:app|window|tab|program)\s*/i, '').trim();
    if (targetApp && targetApp.length > 1 && !targetApp.includes('jarvis')) {
      return {
        isCommand: true,
        type: 'APP_CLOSE',
        appName: targetApp,
        spokenReply: isUrdu
          ? `"${targetApp}" بند کر دیا گیا ہے، ${formalUrduName}۔`
          : isRomanUrdu
          ? `Jee ${romanName}, "${targetApp}" band kar diya gaya hai.`
          : callerName
          ? `Closed ${targetApp} for you, ${callerName}.`
          : `Closed ${targetApp}, sir.`,
      };
    }
  }

  if (lower.match(/\b(band\s+karo|close|shut\s+down|stop\s+everything|exit)\b/i)) {
    return {
      isCommand: true,
      type: 'APP_CLOSE',
      appName: 'Application',
      spokenReply: isUrdu
        ? `ایپلیکیشن بند کر دی گئی ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, application band kar di hai.`
        : callerName
        ? `Closed application for you, ${callerName}.`
        : `Closed application, sir.`,
    };
  }

  // 12. Check for unauthorized app requests (e.g. "open Photoshop", etc.)
  const genericOpen = lower.match(/\b(?:open|launch|kholo)\s+([a-zA-Z0-9_\-\s]+)\b/i);
  if (genericOpen && genericOpen[1]) {
    const candidate = genericOpen[1].trim().toLowerCase();
    const authorizedKeys = [
      'chrome', 'edge', 'vscode', 'cursor', 'code', 'minimax', 'spotify', 'discord', 'notepad', 'calculator',
      'explorer', 'youtube', 'whatsapp', 'telegram', 'paint', 'settings', 'clock', 'steam', 'store', 'terminal'
    ];
    const isConversationalOrQuestion =
      candidate.includes('?') ||
      /\b(batao|kya|kyun|kaise|kaisay|suno|explain|search|dhundo|help|meaning|tarika|tareeqa|sawal|answer)\b/i.test(lower);
    const isKnown = authorizedKeys.some((k) => candidate.includes(k));
    if (!isConversationalOrQuestion && !isKnown && candidate.length > 2 && !candidate.includes('jarvis') && !candidate.includes('tab')) {
      return {
        isCommand: true,
        type: 'UNAUTHORIZED',
        appName: candidate,
        spokenReply: isUrdu
          ? `معذرت ${formalUrduName}، ایپلیکیشن '${candidate}' اجازت یافتہ لسٹ میں شامل نہیں ہے۔`
          : isRomanUrdu
          ? `Maazrat ${romanName}, application '${candidate}' authorized list mein shamil nahi hai.`
          : callerName
          ? `That application is not authorized on this system, ${callerName}.`
          : 'That application is not currently authorized.',
      };
    }
  }

  // 13. Screen Scrolling
  if (
    lower.match(/\b(scroll\s+down|neeche\s+scroll|neeche\s+jao|scroll\s+neeche|page\s+down)\b/i) ||
    lower === 'down' ||
    lower === 'neeche'
  ) {
    return {
      isCommand: true,
      type: 'SCREEN_SCROLL',
      direction: 'down',
      amount: 500,
      spokenReply: isUrdu
        ? `اسکرین نیچے اسکرول کر دی گئی ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, screen neeche scroll kar di hai.`
        : callerName
        ? `I scrolled down for you, ${callerName}.`
        : 'Scrolling down, sir.',
    };
  }

  if (
    lower.match(/\b(scroll\s+up|ooper\s+scroll|upar\s+scroll|upar\s+jao|ooper\s+jao|page\s+up)\b/i) ||
    lower === 'up' ||
    lower === 'upar' ||
    lower === 'ooper'
  ) {
    return {
      isCommand: true,
      type: 'SCREEN_SCROLL',
      direction: 'up',
      amount: 500,
      spokenReply: isUrdu
        ? `اسکرین اوپر اسکرول کر دی گئی ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, screen ooper scroll kar di hai.`
        : callerName
        ? `I scrolled up for you, ${callerName}.`
        : 'Scrolling up, sir.',
    };
  }

  // 14. Media Control
  if (
    lower.match(/\b(pause|stop\s+music|stop\s+song|gana\s+roko|gana\s+pause|music\s+roko|pause\s+music)\b/i) ||
    lower === 'pause' ||
    lower === 'roko'
  ) {
    return {
      isCommand: true,
      type: 'MEDIA_CONTROL',
      action: 'pause',
      spokenReply: isUrdu
        ? `میڈیا پاز کر دیا گیا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, gaana pause kar diya gaya hai.`
        : callerName
        ? `I paused media playback for you, ${callerName}.`
        : 'Media paused, sir.',
    };
  }

  if (
    lower.match(/\b(play|resume\s+music|gana\s+chalao|music\s+play|play\s+music|chalao)\b/i) ||
    lower === 'play' ||
    lower === 'chalao'
  ) {
    return {
      isCommand: true,
      type: 'MEDIA_CONTROL',
      action: 'play',
      spokenReply: isUrdu
        ? `میڈیا پلے کر دیا گیا ہے، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Jee ${romanName}, gaana play kar diya gaya hai.`
        : callerName
        ? `I resumed media playback for you, ${callerName}.`
        : 'Resuming media playback, sir.',
    };
  }

  // 15. Instant conversational responses (Zero Network Latency / Immediate Feedback)
  // a. How are you / Kaise ho / Kya haal hai
  if (lower.match(/\b(kaise\s+ho|kaisay\s+ho|kya\s+haal\s+hai|kya\s+hal\s+hai|how\s+are\s+you|haal\s+chaal)\b/i)) {
    return {
      isCommand: true,
      type: 'FAST_CHAT',
      spokenReply: isUrdu
        ? `میں بالکل ٹھیک ہوں ${formalUrduName}، آپ کا شکریہ۔ فرمائیے میں آپ کی کیا خدمت کروں؟`
        : isRomanUrdu
        ? `Main bilkul theek hoon ${romanName}, aapka shukriya. Boliye main aapki kya madad kar sakta hoon?`
        : callerName
        ? `All systems operational and ready for your command, ${callerName}. How can I assist you today?`
        : 'All systems operational, sir. How may I assist you today?',
    };
  }

  // b. Who are you / Tum kaun ho / Aap kaun hain
  if (lower.match(/\b(tum\s+kaun\s+ho|tum\s+kon\s+ho|aap\s+kaun\s+hain|aap\s+kon\s+hain|who\s+are\s+you|who\s+made\s+you)\b/i)) {
    return {
      isCommand: true,
      type: 'FAST_CHAT',
      spokenReply: isUrdu
        ? `میں جاروس ہوں، آپ کا ذاتی AI اسسٹنٹ۔ میں آپ کا کمپیوٹر کنٹرول کر سکتا ہوں اور ہر کام میں آپ کی مدد کر سکتا ہوں، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Main JARVIS hoon, aapka personal AI assistant. Main aapka PC control kar sakta hoon, apps khol sakta hoon aur har cheez mein aapki madad kar sakta hoon, ${romanName}.`
        : callerName
        ? `I am J.A.R.V.I.S., your personal artificial intelligence assistant, configured to assist you with computer control and intelligence, ${callerName}.`
        : 'I am J.A.R.V.I.S., your personal AI assistant.',
    };
  }

  // c. What can you do / Kya kar sakte ho
  if (lower.match(/\b(kya\s+kar\s+sakte\s+ho|kya\s+kuch\s+kar\s+sakte\s+ho|what\s+can\s+you\s+do|features|capabilities)\b/i)) {
    return {
      isCommand: true,
      type: 'FAST_CHAT',
      spokenReply: isUrdu
        ? `میں یوٹیوب، کروم، اسپاٹیفائی، ڈسکارڈ جیسی ایپس اوپن کر سکتا ہوں، اسکرین اسکرول، میڈیا کنٹرول اور لائیو ویب ریسرچ کر سکتا ہوں، ${formalUrduName}۔`
        : isRomanUrdu
        ? `Main YouTube, Chrome, Spotify, Discord jaisi apps open kar sakta hoon, screen scroll, media control aur live internet search kar sakta hoon, ${romanName}.`
        : callerName
        ? `I can launch PC applications, control playback, scroll pages, and conduct real-time web research for you, ${callerName}.`
        : 'I can launch PC applications, control media, and conduct real-time web research, sir.',
    };
  }

  // d. Suno / Sun rahe ho / Are you listening / Hey jarvis
  if (lower.match(/^(?:suno|sun\s+rahe\s+ho|are\s+you\s+listening|are\s+you\s+there|hello\s+jarvis|hey\s+jarvis|jarvis)$/i)) {
    return {
      isCommand: true,
      type: 'FAST_CHAT',
      spokenReply: isUrdu
        ? `جی ${formalUrduName}، میں سن رہا ہوں۔ حکم کیجیے۔`
        : isRomanUrdu
        ? `Jee ${romanName}, main hazir hoon. Hukm karein.`
        : callerName
        ? `Always at your service, ${callerName}. What is your command?`
        : 'At your service, sir. What is your command?',
    };
  }

  // e. Shukriya / Thank you / Thanks
  if (lower.match(/\b(shukriya|shukria|thank\s+you|thanks|jazakallah)\b/i)) {
    return {
      isCommand: true,
      type: 'FAST_CHAT',
      spokenReply: isUrdu
        ? `کوئی بات نہیں ${formalUrduName}، آپ کی خدمت میرے لیے اعزاز ہے۔`
        : isRomanUrdu
        ? `Koi baat nahi ${romanName}, aapki khidmat mere liye aizzaaz hai.`
        : callerName
        ? `You are most welcome, ${callerName}. Always a pleasure.`
        : 'You are most welcome, sir. Always a pleasure.',
    };
  }

  return {
    isCommand: false,
  };
}
