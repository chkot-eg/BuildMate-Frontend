export interface Session {
  sessionId: string;
  messageCount: number;
  lastActivity: Date;
  createdAt: Date;
  topic?: string;
  context?: string;
}

export interface SessionAnalytics {
  totalSessions: number;
  averageMessageCount: number;
  averageSessionDuration: number;
  mostQueriedTables: Array<{
    table: string;
    count: number;
  }>;
}