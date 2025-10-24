import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject, of } from 'rxjs';
import { catchError, retry, tap, takeUntil } from 'rxjs/operators';
import { Message, ChatResponse } from '../models/message.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private currentSessionId: string | null = null;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Abort controller for canceling requests
  private abortController$ = new Subject<void>();

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second

  // NEW: Performance metrics
  private metricsSubject = new BehaviorSubject({
    totalQueries: 0,
    greetingsHandled: 0,
    avgResponseTime: 0,
    lastQueryTime: 0
  });
  public metrics$ = this.metricsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      this.currentSessionId = savedSessionId;
    } else {
      this.generateNewSession();
    }
  }

  private generateNewSession(): void {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    this.currentSessionId = `session_${timestamp}_${random}`;
    localStorage.setItem('sessionId', this.currentSessionId);
  }

  /**
   * NEW: Check if query is a greeting (handle locally)
   */
  private isGreeting(query: string): boolean {
    const greetingPatterns = [
      /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day))$/i,
      /^how\s+(are\s+you|is\s+your\s+health|do\s+you\s+do)[\s?]*$/i,
      /^(thanks|thank\s+you|bye|goodbye)[\s!]*$/i,
      /^test$/i,
      /^hei|hallo$/i  // Norwegian greetings
    ];

    return greetingPatterns.some(pattern => pattern.test(query.trim()));
  }

  /**
   * NEW: Get quick greeting response
   */
  private getGreetingResponse(query: string): string {
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery.includes('how') && lowerQuery.includes('are you')) {
      return "I'm doing great! Ready to help you with your IBM i database queries.";
    }

    if (lowerQuery.match(/^(hi|hello|hey|hei|hallo)/i)) {
      return "Hello! I can help you look up invoices, customers, orders, and more from your IBM i database.";
    }

    if (lowerQuery.includes('thanks') || lowerQuery.includes('thank')) {
      return "You're welcome! Let me know if you need anything else.";
    }

    if (lowerQuery.includes('bye') || lowerQuery.includes('goodbye')) {
      return "Goodbye! Feel free to come back anytime you need help with your database.";
    }

    return "Hello! What information would you like me to look up from your database?";
  }

  canSendRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  }

  sendMessage(content: string, useContext: boolean = true): Observable<ChatResponse> {
    if (!this.canSendRequest()) {
      return throwError(() => new Error('Please wait before sending another message'));
    }

    // NEW: Handle greetings instantly
    if (environment.enableGreetingCache && this.isGreeting(content)) {
      const greetingResponse = this.getGreetingResponse(content);
      
      // Add user message
      const userMessage: Message = {
        id: this.generateMessageId(),
        role: 'user',
        content: content,
        timestamp: new Date()
      };
      this.addMessage(userMessage);

      // Add instant greeting response
      const assistantMessage: Message = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: greetingResponse,
        timestamp: new Date(),
        isGreeting: true,
        metadata: {
          executionTime: 0,
          tablesUsed: [],
          isGreeting: true,
          fromCache: true
        }
      };
      this.addMessage(assistantMessage);

      // Update metrics
      const metrics = this.metricsSubject.value;
      this.metricsSubject.next({
        ...metrics,
        totalQueries: metrics.totalQueries + 1,
        greetingsHandled: metrics.greetingsHandled + 1,
        lastQueryTime: 0
      });

      return of({
        success: true,
        response: greetingResponse,
        isGreeting: true,
        executionTime: 0,
        tablesUsed: [],
        fromCache: true
      });
    }

    this.isLoadingSubject.next(true);
    const startTime = Date.now();

    // Add user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Session-ID': this.currentSessionId || ''
      // Temporary: Commented out custom headers until backend CORS is fixed
      // 'X-Default-Library': environment.defaultLibrary,
      // 'X-Client-Version': '2.0.0',
      // 'X-Enable-Cache': String(environment.cacheEnabled)
    });

    const body = {
      prompt: content,
      sessionId: useContext ? this.currentSessionId : undefined,
      maxHistoryMessages: 10,
      // NEW: Simplified config - no library parameter needed
      config: {
        useCache: environment.cacheEnabled,
        timeout: 30000
      }
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/api/chat/query`, body, { headers })
      .pipe(
        takeUntil(this.abortController$), // Allow canceling the request
        retry(2),
        tap(response => {
          const executionTime = Date.now() - startTime;
          this.isLoadingSubject.next(false);

          // Update metrics
          this.updateMetrics(response, executionTime);

          if (response.success && (response.result || response.response)) {
            const assistantMessage: Message = {
              id: this.generateMessageId(),
              role: 'assistant',
              content: response.result || response.response || response.formatted || '',
              timestamp: new Date(),
              isGreeting: response.isGreeting,
              metadata: {
                executionTime: response.executionTime || executionTime,
                tablesUsed: response.tablesUsed || [],
                hasContext: response.hasContext,
                fromCache: response.fromCache,
                isGreeting: response.isGreeting,
                queryOptimized: response.queryOptimized,
                ...(response.metadata || {})
              }
            };
            this.addMessage(assistantMessage);

            // Log performance
            this.logPerformance(response, executionTime);

            // Validate database verification
            if (response.metadata && response.tablesUsed && response.tablesUsed.length === 0 && !response.isGreeting) {
              console.warn('Warning: Response not verified with database', response);
            }
          }
        }),
        catchError(error => {
          this.isLoadingSubject.next(false);

          // Don't show error message if request was aborted by user
          if (error.name !== 'AbortError') {
            const errorMessage: Message = {
              id: this.generateMessageId(),
              role: 'assistant',
              content: this.formatError(error),
              timestamp: new Date(),
              isError: true
            };
            this.addMessage(errorMessage);
          }

          return throwError(() => error);
        })
      );
  }

  stopCurrentRequest(): void {
    this.abortController$.next();
    this.isLoadingSubject.next(false);

    // Add a message indicating the request was stopped
    const stoppedMessage: Message = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: ' ',
      timestamp: new Date(),
      isError: false
    };
    this.addMessage(stoppedMessage);
  }

  /**
   * NEW: Format errors based on type
   */
  private formatError(error: any): string {
    const errorMsg = error.message || error.error?.error || error;

    // Handle specific error cases
    if (typeof errorMsg === 'string') {
      if (errorMsg.includes('not found')) {
        return 'I couldn\'t find that information. Please try rephrasing your question or check if the data exists.';
      }

      if (errorMsg.includes('timeout')) {
        return 'The request took too long. Please try a simpler query or contact support if the issue persists.';
      }

      if (errorMsg.includes('library') || errorMsg.includes('LIBL type *FILE not found')) {
        return 'Database configuration issue detected. The system will automatically add the library prefix.';
      }
    }

    return `I encountered an error: ${errorMsg}. Please try again or contact support.`;
  }

  /**
   * NEW: Track performance metrics
   */
  private updateMetrics(response: any, executionTime: number): void {
    const metrics = this.metricsSubject.value;
    
    const newMetrics = {
      totalQueries: metrics.totalQueries + 1,
      greetingsHandled: metrics.greetingsHandled + (response.isGreeting ? 1 : 0),
      lastQueryTime: executionTime,
      avgResponseTime: (metrics.avgResponseTime * metrics.totalQueries + executionTime) / (metrics.totalQueries + 1)
    };

    this.metricsSubject.next(newMetrics);
  }

  /**
   * NEW: Performance logging
   */
  private logPerformance(response: any, executionTime: number): void {
    if (executionTime) {
      console.log(`Query executed in ${executionTime}ms`);

      // Track slow queries
      if (executionTime > 5000) {
        console.warn('Slow query detected:', {
          time: executionTime,
          tables: response.tablesUsed
        });
      }
    }

    // Log instant responses
    if (response.isGreeting) {
      console.log('Instant greeting response served');
    }
  }

  private addMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  clearSession(): Observable<any> {
    if (!this.currentSessionId) return throwError(() => new Error('No active session'));

    return this.http.post(`${this.apiUrl}/api/chat/sessions/${this.currentSessionId}/clear`, {})
      .pipe(
        tap(() => this.clearMessages())
      );
  }

  getSessionContext(): Observable<any> {
    if (!this.currentSessionId) return throwError(() => new Error('No active session'));

    return this.http.get(`${this.apiUrl}/api/chat/sessions/${this.currentSessionId}/context`);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportChat(): void {
    const messages = this.messagesSubject.value;
    const exportData = messages.map(msg => {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      const time = msg.timestamp.toLocaleTimeString();
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}