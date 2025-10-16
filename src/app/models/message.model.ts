export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  isError?: boolean;
}

export interface MessageMetadata {
  executionTime?: number;
  tablesUsed?: string[];
  queryOptimized?: boolean;
  hasContext?: boolean;
  cacheHit?: boolean;
}

export interface ChatResponse {
  success: boolean;
  result?: string;
  error?: string;
  executionTime?: number;
  sessionId?: string;
  hasContext?: boolean;
  metadata?: MessageMetadata;
  tablesUsed?: string[];
}