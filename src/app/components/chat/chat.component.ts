import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages$: Observable<Message[]>;
  isLoading$: Observable<boolean>;
  messageControl = new FormControl('', [Validators.required]);

  // NEW: Performance metrics
  metrics$!: Observable<any>;
  metrics = {
    totalQueries: 0,
    greetingsHandled: 0,
    avgResponseTime: 0,
    lastQueryTime: 0
  };

  quickActions = [
    { label: 'Show Tables', prompt: 'Show me all tables in the database' },
    { label: 'Customer Info', prompt: 'Show customer information' },
    { label: 'Recent Orders', prompt: 'Show recent orders' },
  ];

  constructor(private chatService: ChatService) {
    this.messages$ = this.chatService.messages$;
    this.isLoading$ = this.chatService.isLoading$;
    this.metrics$ = this.chatService.metrics$;
    
    // Subscribe to metrics
    this.metrics$.subscribe(m => this.metrics = m);
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (this.messageControl.valid && this.messageControl.value) {
      const message = this.messageControl.value;
      this.messageControl.reset();

      this.chatService.sendMessage(message).subscribe({
        next: () => {
          // Message sent successfully
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    }
  }

  executeQuickAction(prompt: string): void {
    this.messageControl.setValue(prompt);
    this.sendMessage();
  }

  clearChat(): void {
    this.chatService.clearSession();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      // Ignore scroll errors
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * NEW: Get performance class for visual feedback
   */
  getPerformanceClass(executionTime?: number): string {
    if (!executionTime) return '';

    if (executionTime < 100) return 'instant-response';
    if (executionTime < 1000) return 'fast-response';
    if (executionTime < 3000) return 'normal-response';
    return 'slow-response';
  }
}