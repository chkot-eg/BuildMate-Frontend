export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  isError?: boolean;
  isGreeting?: boolean;  // NEW: Flag for instant greeting responses
}

export interface MessageMetadata {
  executionTime?: number;
  tablesUsed?: string[];
  queryOptimized?: boolean;
  hasContext?: boolean;
  cacheHit?: boolean;
  fromCache?: boolean;  // NEW: Backend cache indicator
  isGreeting?: boolean;  // NEW: Greeting response indicator
  iterationCount?: number;  // NEW: Query optimization iterations
}

export interface ChatResponse {
  success: boolean;
  result?: string;
  response?: string;  // NEW: Alternative response field
  formatted?: string;  // NEW: Formatted response
  error?: string;
  executionTime?: number;
  sessionId?: string;
  hasContext?: boolean;
  metadata?: MessageMetadata;
  tablesUsed?: string[];
  isGreeting?: boolean;  // NEW: Instant greeting flag
  fromCache?: boolean;  // NEW: Cache status
  queryOptimized?: boolean;  // NEW: Query optimization flag
}

// NEW: Updated response models matching backend changes
export interface QueryResponse {
  response?: string;
  formatted?: string;
  executionTime: number;
  tablesUsed: string[];
  isGreeting?: boolean;
  fromCache?: boolean;
  queryOptimized?: boolean;
  iterationCount?: number;
  error?: QueryError;
}

export interface QueryError {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
}

export interface SchemaResponse {
  tables: TableSchema[];
  fromCache: boolean;
  executionTime: number;
}

export interface TableSchema {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
  TABLE_TEXT: string;
  columns: ColumnDefinition[];
  // These are now always empty for performance
  primaryKeys: string[];
  foreignKeys: any[];
  indexes: any[];
}

export interface ColumnDefinition {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  LENGTH?: number;
  NUMERIC_SCALE?: number;
  IS_NULLABLE: string;
  COLUMN_DEFAULT?: string;
  COLUMN_TEXT?: string;
  ORDINAL_POSITION: number;
}

export interface PerformanceMetrics {
  totalQueries: number;
  cacheHits: number;
  avgResponseTime: number;
  slowQueries: number;
  greetingsHandled: number;
}