export type MessageRole = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  data?: string; // Base64 data for images
  text?: string; // Text content for documents/code
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, any>;
  result: Record<string, any>;
}

export interface SystemAutomation {
  action: string;
  target: string;
  parameters?: string | null;
  requiresConfirmation: boolean;
  status: 'pending_confirmation' | 'executed' | 'cancelled';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  toolCalls?: ToolCallRecord[];
  systemAutomation?: SystemAutomation;
  status?: 'sending' | 'complete' | 'error';
}

export interface MemoryItem {
  id: string;
  key: string;
  fact: string;
  timestamp: string;
  category?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  token?: string;
  createdAt: string;
}

export interface UserSettings {
  assistantName: string;
  userName?: string;
  speechEnabled: boolean;
  autoSpeakReplies: boolean;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  model: string;
  responseStyle: 'concise' | 'balanced' | 'detailed' | 'professional';
  temperature: number;
  confirmAutomations: boolean;
  voiceEngine?: 'easyVoice' | 'fishAudio' | 'browser';
  easyVoiceVoice?: string;
  micSensitivity?: number; // 0 to 100 percentage
  language?: string;
  theme?: string;
}

export type VoiceState = 'ready' | 'listening' | 'processing' | 'thinking' | 'executing' | 'speaking' | 'booting';

export interface JarvisToolItem {
  id: string;
  name: string;
  displayName: string;
  version: string;
  category: 'information' | 'system' | 'productivity' | 'utilities' | 'integrations' | 'plugins';
  description: string;
  enabled: boolean;
  isPlugin: boolean;
  author: string;
  parameterSchema?: any;
}

export interface CustomPluginPayload {
  name: string;
  displayName: string;
  version?: string;
  category?: string;
  description: string;
  parameterName: string;
  parameterDescription: string;
  mockResponseTemplate: string;
}

export interface SystemStatus {
  status: string;
  name: string;
  version: string;
  model: string;
  hasApiKey: boolean;
  hasGemini?: boolean;
  hasGroq?: boolean;
  hasTavily?: boolean;
  hasFishAudio?: boolean;
  hasEasyVoice?: boolean;
  platform: string;
  systemTime: string;
  memoryCount: number;
  activeToolsCount?: number;
  totalToolsCount?: number;
  activeTools: string[];
  connectedServices?: {
    gemini: boolean;
    groq: boolean;
    tavilySearch: boolean;
    easyVoiceTTS?: boolean;
    fishAudioTTS: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  timestampLabel?: string;
}

export interface AllowedAppInfo {
  id: string;
  name: string;
  aliases: string[];
  command: string;
  category: string;
  description: string;
  webFallbackUrl?: string | null;
}

export interface ElectronAPI {
  isDesktop: boolean;
  platform: string;
  launchApp: (appName: string) => Promise<{ success: boolean; app?: string; message?: string; error?: string; rejected?: boolean; blocked?: boolean }>;
  closeApp?: (appName: string) => Promise<{ success: boolean; app?: string }>;
  openUrl?: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  scrollScreen?: (direction: string, amount?: number) => Promise<{ success: boolean; direction?: string; amount?: number }>;
  controlMedia?: (action: string, service?: string) => Promise<{ success: boolean; action?: string; service?: string }>;
  getAllowedApps: () => Promise<AllowedAppInfo[]>;
  executeCommand: (cmd: string) => Promise<any>;
}

export interface DiagnosticCoreMetric {
  id: number;
  model: string;
  speedMHz: number;
  usagePercent: number;
  tempC: number;
}

export interface SystemDiagnosticsData {
  timestamp: number;
  cpu: {
    usagePercent: number;
    cores: DiagnosticCoreMetric[];
    loadAvg: [number, number, number];
    processCount?: number;
    threadsCount?: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
    totalGB: number;
    usedGB: number;
    freeGB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  thermal: {
    packageTempC: number;
    maxTempC: number;
    criticalTempC: number;
    thermalStatus: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
    fanRpm: number;
    sensorSource: string;
    throttlingActive: boolean;
  };
  system: {
    hostname: string;
    platform: string;
    arch: string;
    osType: string;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  network?: {
    latencyMs: number;
    requestsPerMinute?: number;
    status: 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';
  };
}

export interface DiagnosticBenchmarkResult {
  score: number;
  durationMs: number;
  operationsPerSec: number;
  tempRiseC: number;
  timestamp: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}



