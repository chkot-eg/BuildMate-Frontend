// voice.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string; // Added for showing real-time text
  language: string;
  error: string | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  // Store final results separately to avoid duplication
  private finalTranscript = '';

  private voiceState = new BehaviorSubject<VoiceState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    language: 'en-US',
    error: null
  });

  voiceState$ = this.voiceState.asObservable();

  // Nordic languages and English
  supportedLanguages: { [key: string]: string } = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'nb-NO': 'Norwegian Bokmål',
    'nn-NO': 'Norwegian Nynorsk',
    'sv-SE': 'Swedish',
    'da-DK': 'Danish',
    'fi-FI': 'Finnish',
    'is-IS': 'Icelandic'
  };

  constructor() {
    this.initializeWebSpeechAPI();
  }

  // Get user's browser language as default
  getDefaultLanguage(): string {
    const browserLang = navigator.language || 'en-US';
    // Check if browser language is supported
    if (this.supportedLanguages[browserLang]) {
      return browserLang;
    }
    // Try to match language prefix
    const langPrefix = browserLang.split('-')[0];
    const matchedLang = Object.keys(this.supportedLanguages).find(key => key.startsWith(langPrefix + '-'));
    // Default to English US if no match
    return matchedLang || 'en-US';
  }

  private initializeWebSpeechAPI(): void {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.setupRecognitionListeners();
      console.log('Speech Recognition initialized');
    } else {
      console.warn('Speech Recognition API not supported');
    }
  }

  private setupRecognitionListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Recognition started');
      this.isListening = true;
      this.finalTranscript = ''; // Reset on new recording
      this.updateState({
        isRecording: true,
        error: null,
        isProcessing: false,
        transcript: '',
        interimTranscript: ''
      });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      // Process ALL results from the beginning, not just from resultIndex
      // This is the key fix - we rebuild the final transcript each time
      this.finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          // Add to final transcript
          this.finalTranscript += transcript;
          console.log('Final:', transcript);
        } else {
          // This is interim (still being processed)
          interimTranscript += transcript;
          console.log('Interim:', transcript);
        }
      }

      // Update state - show final + interim combined for display
      // But only store final in the actual transcript
      this.updateState({
        transcript: this.finalTranscript.trim(),
        interimTranscript: interimTranscript,
        isProcessing: interimTranscript.length > 0
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      const errorMessages: { [key: string]: string } = {
        'network': 'Network error. Check your internet connection.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found.',
        'not-allowed': 'Microphone access denied. Please allow access.',
        'aborted': 'Recording stopped.',
      };

      // Don't show error if we already have a transcript
      if (event.error === 'no-speech' && this.finalTranscript) {
        return;
      }

      // Don't show aborted as error
      if (event.error === 'aborted') {
        return;
      }

      const errorMsg = errorMessages[event.error] || `Error: ${event.error}`;
      this.updateState({
        error: errorMsg,
        isRecording: false,
        isProcessing: false
      });
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('Recognition ended');
      this.isListening = false;

      // Clear interim transcript and finalize
      this.updateState({
        isRecording: false,
        isProcessing: false,
        interimTranscript: '',
        // Keep the final transcript as is
      });
    };
  }

  startRecording(language: string = 'en-US'): void {
    if (!this.recognition) {
      this.updateState({
        error: 'Speech Recognition not supported. Use Chrome or Edge.'
      });
      return;
    }

    if (this.isListening) {
      console.log('Already recording');
      return;
    }

    try {
      // Configure recognition
      this.recognition.lang = language;
      this.recognition.continuous = true;      // Keep listening
      this.recognition.interimResults = true;  // Show real-time results
      this.recognition.maxAlternatives = 1;

      // Reset state
      this.finalTranscript = '';
      this.updateState({
        transcript: '',
        interimTranscript: '',
        error: null,
        language
      });

      // Start recognition
      this.recognition.start();
      console.log('Started recording, language:', language);

    } catch (error: any) {
      console.error('Error starting:', error);

      if (error.message?.includes('already started')) {
        this.recognition.stop();
        setTimeout(() => this.startRecording(language), 300);
        return;
      }

      this.updateState({
        error: 'Failed to start recording',
        isRecording: false
      });
    }
  }

  stopRecording(): void {
    console.log('Stopping recording...');

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping:', error);
      }
    }

    this.isListening = false;
    this.updateState({
      isRecording: false,
      isProcessing: false,
      interimTranscript: ''
    });
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  getTranscript(): string {
    return this.voiceState.value.transcript;
  }

  // Get combined transcript (final + interim) for display
  getDisplayTranscript(): string {
    const state = this.voiceState.value;
    if (state.interimTranscript) {
      return (state.transcript + ' ' + state.interimTranscript).trim();
    }
    return state.transcript;
  }

  clearTranscript(): void {
    this.finalTranscript = '';
    this.updateState({
      transcript: '',
      interimTranscript: '',
      error: null
    });
  }

  getSupportedLanguages(): { [key: string]: string } {
    return this.supportedLanguages;
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.voiceState.next({
      ...this.voiceState.value,
      ...partial
    });
  }
}
