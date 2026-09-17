export type ToolCategory =
  | 'information'
  | 'system'
  | 'productivity'
  | 'utilities'
  | 'integrations'
  | 'plugins';

export interface ToolContext {
  storedMemories: any[];
  addMemory: (key: string, fact: string) => any;
  calendarEvents: any[];
  addCalendarEvent: (event: any) => any;
  notes: any[];
  addNote: (note: any) => any;
}

export interface ToolResult {
  result: Record<string, any>;
  sideEffect?: {
    type: string;
    [key: string]: any;
  };
}

export interface JarvisToolDefinition {
  id: string;
  name: string;
  displayName: string;
  version: string;
  category: ToolCategory;
  description: string;
  parameters: any;
  enabled: boolean;
  isPlugin?: boolean;
  author?: string;
  execute: (args: Record<string, any>, context: ToolContext) => Promise<ToolResult> | ToolResult;
}

export interface CustomPluginPayload {
  name: string;
  displayName: string;
  version: string;
  category?: ToolCategory;
  description: string;
  parameterName: string;
  parameterDescription: string;
  mockResponseTemplate: string;
}
