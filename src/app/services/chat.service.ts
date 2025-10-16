import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
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

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second

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

    this.isLoadingSubject.next(true);

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
    });

    const body = {
      prompt: content,
      sessionId: useContext ? this.currentSessionId : undefined,
      maxHistoryMessages: 10
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/api/chat/query`, body, { headers })
      .pipe(
        retry(2),
        tap(response => {
          this.isLoadingSubject.next(false);

          if (response.success && response.result) {
            const assistantMessage: Message = {
              id: this.generateMessageId(),
              role: 'assistant',
              content: response.result,
              timestamp: new Date(),
              metadata: response.metadata || {
                executionTime: response.executionTime,
                tablesUsed: response.tablesUsed,
                hasContext: response.hasContext
              }
            };
            this.addMessage(assistantMessage);

            // Validate database verification
            if (response.metadata && response.tablesUsed && response.tablesUsed.length === 0) {
              console.warn('Warning: Response not verified with database', response);
            }
          }
        }),
        catchError(error => {
          this.isLoadingSubject.next(false);

          const errorMessage: Message = {
            id: this.generateMessageId(),
            role: 'assistant',
            content: error.error?.error || 'An error occurred. Please try again.',
            timestamp: new Date(),
            isError: true
          };
          this.addMessage(errorMessage);

          return throwError(() => error);
        })
      );
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