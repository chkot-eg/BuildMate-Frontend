import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Session, SessionAnalytics } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSessions(): Observable<{ success: boolean; sessions: Session[] }> {
    return this.http.get<{ success: boolean; sessions: Session[] }>(
      `${this.apiUrl}/api/chat/sessions`
    );
  }

  getSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/sessions/${sessionId}`);
  }

  deleteSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/chat/sessions/${sessionId}`);
  }

  getSessionMessages(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/sessions/${sessionId}/messages`);
  }

  getSessionAnalytics(): Observable<{ success: boolean; analytics: SessionAnalytics }> {
    return this.http.get<{ success: boolean; analytics: SessionAnalytics }>(
      `${this.apiUrl}/api/analytics/sessions`
    );
  }

  getContextEffectiveness(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/analytics/context-effectiveness`);
  }
}
