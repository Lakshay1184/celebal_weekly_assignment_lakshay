export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string; // ISO String
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string; // ISO String
}

export interface ModelControls {
  temperature: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
}

export interface HardwareState {
  device: string;
  vramUsed: number;
  vramTotal: number;
  active: boolean;
  tokenSpeed?: number; // tokens/sec
}
