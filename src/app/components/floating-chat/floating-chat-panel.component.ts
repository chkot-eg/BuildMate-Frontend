import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChatToggleService, ChatState, ChatSize } from '../../services/chat-toggle.service';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-floating-chat-panel',
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
    MatTooltipModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './floating-chat-panel.component.html',
  styleUrls: ['./floating-chat-panel.component.scss']
})
export class FloatingChatPanelComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('chatPanel') private chatPanel!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  isOpen$: Observable<boolean>;
  state$: Observable<ChatState>;
  messages$: Observable<Message[]>;
  isLoading$: Observable<boolean>;
  messageControl = new FormControl('', {
    validators: [Validators.required, Validators.maxLength(2000)],
    updateOn: 'change' // Keep immediate updates but optimize rendering
  });

  // Resize state
  isResizing = false;
  resizeDirection = '';
  startX = 0;
  startY = 0;
  startWidth = 0;
  startHeight = 0;

  // Drag state
  isDragging = false;
  dragPosition = { x: 20, y: 20 };

  // Scroll state
  private shouldAutoScroll = true;
  private previousMessageCount = 0;
  private isUserScrolling = false;
  private isLoading = false;

  // Context toggle
  useContext = true;

  // Quick actions toggle
  showQuickActions = false;

  // Quick actions list
  quickActions = [
    { label: 'Show Tables', prompt: 'Show me all tables in the database', icon: 'storage' },
    { label: 'Customer Info', prompt: 'Show customer information', icon: 'people' },
    { label: 'Recent Orders', prompt: 'Show recent orders from the last 7 days', icon: 'receipt' },
    { label: 'Inventory', prompt: 'Check inventory status for products', icon: 'inventory' },
    { label: 'SQL Help', prompt: 'Help with SQL queries', icon: 'code' }
  ];

  constructor(
    private chatToggleService: ChatToggleService,
    private chatService: ChatService
  ) {
    this.isOpen$ = this.chatToggleService.isOpen$;
    this.state$ = this.chatToggleService.state$;
    this.messages$ = this.chatService.messages$;
    this.isLoading$ = this.chatService.isLoading$;
  }

  ngOnInit(): void {
    // Load saved position if available
    const state = this.chatToggleService.getState();
    this.dragPosition = state.position;

    // Subscribe to loading state
    this.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Subscribe to messages to detect changes
    this.messages$.subscribe(messages => {
      if (messages.length > this.previousMessageCount) {
        this.previousMessageCount = messages.length;
        // Only auto-scroll if user hasn't manually scrolled up
        if (!this.isUserScrolling) {
          this.shouldAutoScroll = true;
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    // Only auto-scroll when new messages arrive and user hasn't scrolled up
    if (this.shouldAutoScroll && !this.isUserScrolling) {
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldAutoScroll = false;
      }, 50);
    }
  }

  closeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.chatToggleService.closeChat();
  }

  onOverlayClick(event: MouseEvent): void {
    // Only close when clicking the overlay, not when clicking the chat panel
    event.stopPropagation();
    this.closeChat();
  }

  minimizeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'minimized') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('minimized');
    }
  }

  maximizeChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'fullscreen') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('fullscreen');
    }
  }

  expandChat(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const currentState = this.chatToggleService.getState();
    if (currentState.size === 'expanded') {
      this.chatToggleService.setSize('normal');
    } else {
      this.chatToggleService.setSize('expanded');
    }
  }

  restoreChat(): void {
    this.chatToggleService.setSize('normal');
  }

  sendMessage(): void {
    if (this.messageControl.valid && this.messageControl.value?.trim()) {
      const message = this.messageControl.value.trim();

      // Store reference to input element before any changes
      const inputElement = this.messageInput?.nativeElement;

      // Clear the input immediately without triggering validations
      this.messageControl.setValue('', {
        emitEvent: false,
        emitModelToViewChange: true,
        emitViewToModelChange: false
      });

      // Mark as pristine to prevent validation flicker
      this.messageControl.markAsPristine();
      this.messageControl.markAsUntouched();

      // Reset textarea height to default
      if (inputElement) {
        inputElement.style.height = '52px';
      }

      // Force scroll to bottom when user sends a message
      this.isUserScrolling = false;
      this.shouldAutoScroll = true;

      this.chatService.sendMessage(message, this.useContext).subscribe({
        next: (response) => {
          // Message sent and response received successfully
          this.scrollToBottom();

          // Restore focus after processing completes
          if (inputElement) {
            inputElement.focus();
          }
        },
        error: (error) => {
          console.error('Chat error:', error);
          // Error message is already handled in the service
          this.scrollToBottom();

          // Restore focus even on error
          if (inputElement) {
            inputElement.focus();
          }
        }
      });
    }
  }

  stopRequest(): void {
    this.chatService.stopCurrentRequest();
  }

  clearChat(): void {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.chatService.clearMessages();
    }
  }

  exportChat(): void {
    this.chatService.exportChat();
  }

  toggleContext(): void {
    this.useContext = !this.useContext;
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const element = this.scrollContainer.nativeElement;
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    } catch (err) {
      // Ignore scroll errors - this can happen during component initialization
      console.debug('Scroll error (non-critical):', err);
    }
  }

  private scrollToBottomSmooth(): void {
    try {
      if (this.scrollContainer?.nativeElement) {
        const element = this.scrollContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    } catch (err) {
      console.debug('Scroll error (non-critical):', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Enter key - send message if not holding Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      // Only send if not currently loading and has valid input
      if (!this.isLoading && this.messageControl.valid && this.messageControl.value?.trim()) {
        this.sendMessage();
      }
    }
    // Shift+Enter allows new line
  }

  adjustTextareaHeight(): void {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';

      // Calculate new height based on content
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 52), 120);

      // Apply new height smoothly
      textarea.style.height = `${newHeight}px`;
    });
  }

  getInputHint(): string {
    if (this.isLoading) {
      return 'Processing your request... Click Stop to cancel';
    }
    return 'Press Enter to send, Shift+Enter for new line';
  }

  getSendButtonTooltip(): string {
    if (this.isLoading) {
      return 'Please wait...';
    }
    if (this.messageControl.invalid || !this.messageControl.value?.trim()) {
      return 'Type a message to send';
    }
    return 'Send message (Enter)';
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Check if user is at the bottom (within 50px threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // If user scrolls up, mark as user scrolling
    if (!isAtBottom) {
      this.isUserScrolling = true;
      this.shouldAutoScroll = false;
    } else {
      // User scrolled back to bottom, re-enable auto-scroll
      this.isUserScrolling = false;
      this.shouldAutoScroll = false; // Will be set to true when new message arrives
    }
  }

  // Resize handling
  startResize(event: MouseEvent, direction: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    const state = this.chatToggleService.getState();
    this.startWidth = state.width;
    this.startHeight = state.height;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    // Handle different resize directions
    if (this.resizeDirection.includes('w')) {
      newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth - deltaX));
    }
    if (this.resizeDirection.includes('e')) {
      newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth + deltaX));
    }
    if (this.resizeDirection.includes('n')) {
      newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, this.startHeight - deltaY));
    }
    if (this.resizeDirection.includes('s')) {
      newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, this.startHeight + deltaY));
    }

    this.chatToggleService.updateDimensions(newWidth, newHeight);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
    this.resizeDirection = '';
  }

  // Drag handling
  onDragEnded(event: any): void {
    this.dragPosition = event.source.getFreeDragPosition();
    this.chatToggleService.updatePosition(this.dragPosition.x, this.dragPosition.y);
  }

  // Quick actions
  executeQuickAction(prompt: string): void {
    if (prompt && prompt.trim()) {
      this.messageControl.setValue(prompt.trim());
      this.sendMessage();
    }
  }
}