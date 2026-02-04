import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { ChatToggleService } from '../../services/chat-toggle.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-floating-chat-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBadgeModule],
  template: `
    <button
      class="floating-chat-button"
      [class.hidden]="isOpen$ | async"
      mat-fab
      color="primary"
      (click)="toggleChat()">
      <mat-icon>chat</mat-icon>
    </button>
  `,
  
  styles: [`
    .floating-chat-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      background: linear-gradient(135deg, #007BFF, #0056B3) !important;
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: pulse 3s ease-in-out infinite;

      &:hover {
        transform: scale(1.08);
        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.5);
        animation-play-state: paused;
      }

      &.hidden {
        transform: scale(0);
        opacity: 0;
        pointer-events: none;
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.6);
      }
    }

    ::ng-deep .mat-mdc-fab {
      width: 64px;
      height: 64px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    ::ng-deep .mat-badge-content {
      background: #FF6B35;
      color: white;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }

    @media (max-width: 768px) {
      .floating-chat-button {
        bottom: 20px;
        right: 20px;
      }

      ::ng-deep .mat-mdc-fab {
        width: 56px;
        height: 56px;
      }

      .floating-chat-button mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    @media (max-width: 480px) {
      .floating-chat-button {
        bottom: 16px;
        right: 16px;
      }

      ::ng-deep .mat-mdc-fab {
        width: 52px;
        height: 52px;
      }

      .floating-chat-button mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }
  `]
})
export class FloatingChatButtonComponent {
  isOpen$: Observable<boolean>;

  constructor(private chatToggleService: ChatToggleService) {
    this.isOpen$ = this.chatToggleService.isOpen$;
  }

  toggleChat(): void {
    this.chatToggleService.openChat();
  }
}