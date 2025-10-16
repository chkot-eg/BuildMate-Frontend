import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ChatSize = 'minimized' | 'normal' | 'expanded' | 'fullscreen';

export interface ChatState {
  isOpen: boolean;
  size: ChatSize;
  width: number;
  height: number;
  position: { x: number; y: number };
}

@Injectable({
  providedIn: 'root'
})
export class ChatToggleService {
  private defaultState: ChatState = {
    isOpen: false,
    size: 'normal',
    width: 400,
    height: 600,
    position: { x: 20, y: 20 }
  };

  private stateSubject = new BehaviorSubject<ChatState>(this.defaultState);
  public state$ = this.stateSubject.asObservable();

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  toggleChat(): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      isOpen: !currentState.isOpen
    });
  }

  openChat(): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      isOpen: true
    });
  }

  closeChat(): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      isOpen: false,
      size: 'normal'
    });
  }

  setSize(size: ChatSize): void {
    const currentState = this.stateSubject.value;
    let width = currentState.width;
    let height = currentState.height;

    switch (size) {
      case 'minimized':
        width = 400;
        height = 200;
        break;
      case 'normal':
        width = 400;
        height = 600;
        break;
      case 'expanded':
        width = 600;
        height = 800;
        break;
      case 'fullscreen':
        width = window.innerWidth;
        height = window.innerHeight;
        break;
    }

    this.updateState({
      ...currentState,
      size,
      width,
      height
    });
  }

  updateDimensions(width: number, height: number): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      width,
      height,
      size: 'normal' // Reset to normal when manually resizing
    });
  }

  updatePosition(x: number, y: number): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      position: { x, y }
    });
  }

  private updateState(newState: ChatState): void {
    this.stateSubject.next(newState);
    this.isOpenSubject.next(newState.isOpen);
  }

  getState(): ChatState {
    return this.stateSubject.value;
  }

  // For backward compatibility
  getIsOpen(): boolean {
    return this.isOpenSubject.value;
  }
}