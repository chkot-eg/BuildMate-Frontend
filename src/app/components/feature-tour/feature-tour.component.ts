import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { FeatureTourService } from '../../services/feature-tour.service';
import { ChatToggleService } from '../../services/chat-toggle.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

interface FeatureLabel {
  id: string;
  title: string;
  targetSelector: string;
  labelPosition: { x: number; y: number };
  lineStyle: 'horizontal-vertical' | 'vertical-horizontal' | 'angled-right' | 'angled-left';
}

@Component({
  selector: 'app-feature-tour',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './feature-tour.component.html',
  styleUrls: ['./feature-tour.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class FeatureTourComponent implements OnInit, OnDestroy {
  showTour = false;
  showWelcome = false;
  currentStep = 0;
  isChatOpen = false;
  features: FeatureLabel[] = [];
  svgLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  svgPaths: string[] = [];
  private destroy$ = new Subject<void>();
  private highlightedElements: Element[] = [];
  private autoAdvanceTimer: any;

  constructor(
    private tourService: FeatureTourService,
    private chatToggleService: ChatToggleService
  ) {}

  ngOnInit(): void {
    // Listen to both chat open state and tour state
    combineLatest([
      this.chatToggleService.isOpen$,
      this.tourService.getShowTour()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([chatOpen, showTour]) => {
        this.isChatOpen = chatOpen;

        if (chatOpen && showTour) {
          this.initializeTour();
          this.showWelcome = true;
          this.showTour = false;
        } else if (!chatOpen) {
          // Hide tour when chat is closed
          this.removeHighlights();
          this.showTour = false;
          this.showWelcome = false;
        } else if (chatOpen && !showTour) {
          this.removeHighlights();
          this.showTour = false;
          this.showWelcome = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.removeHighlights();
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentFeature(): FeatureLabel | undefined {
    return this.features[this.currentStep];
  }

  private initializeTour(): void {
    this.features = [
      {
        id: 'voice-input',
        title: 'Voice Input',
        targetSelector: '.voice-btn',
        labelPosition: { x: window.innerWidth - 580, y: window.innerHeight - 150 },
        lineStyle: 'horizontal-vertical'
      },
      {
        id: 'context-toggle',
        title: 'Context Memory',
        targetSelector: '.context-btn',
        labelPosition: { x: window.innerWidth - 580, y: window.innerHeight - 230 },
        lineStyle: 'angled-right'
      },
      {
        id: 'export-chat',
        title: 'Export History',
        targetSelector: '.header-btn:nth-child(1)',
        labelPosition: { x: window.innerWidth - 620, y: 80 },
        lineStyle: 'vertical-horizontal'
      },
      {
        id: 'clear-chat',
        title: 'Clear Chat',
        targetSelector: '.header-btn:nth-child(2)',
        labelPosition: { x: window.innerWidth - 620, y: 160 },
        lineStyle: 'angled-left'
      }
    ];

    this.currentStep = 0;
  }

  private calculateLines(): void {
    this.svgLines = [];

    // Wait for labels to render
    setTimeout(() => {
      this.features.forEach((feature, index) => {
        const target = document.querySelector(feature.targetSelector);
        const labelElements = document.querySelectorAll('.feature-label');
        const labelElement = labelElements[index];

        if (!target || !labelElement) return;

        const targetRect = target.getBoundingClientRect();
        const labelRect = labelElement.getBoundingClientRect();

        // Calculate target center point (pointing to center of icon)
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        // Calculate label edge connection point (closest edge to target)
        const labelCenterX = labelRect.left + labelRect.width / 2;
        const labelCenterY = labelRect.top + labelRect.height / 2;

        let labelX: number, labelY: number;

        // Determine which edge of label to connect from based on relative position
        const dx = targetX - labelCenterX;
        const dy = targetY - labelCenterY;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal connection
          if (dx > 0) {
            // Target is to the right
            labelX = labelRect.right;
            labelY = labelCenterY;
          } else {
            // Target is to the left
            labelX = labelRect.left;
            labelY = labelCenterY;
          }
        } else {
          // Vertical connection
          if (dy > 0) {
            // Target is below
            labelX = labelCenterX;
            labelY = labelRect.bottom;
          } else {
            // Target is above
            labelX = labelCenterX;
            labelY = labelRect.top;
          }
        }

        this.svgLines.push({
          x1: labelX,
          y1: labelY,
          x2: targetX,
          y2: targetY
        });
      });
    }, 100);
  }

  private addHighlights(): void {
    this.features.forEach(feature => {
      const element = document.querySelector(feature.targetSelector);
      if (element) {
        element.classList.add('tour-highlight');
        this.highlightedElements.push(element);
      }
    });
  }

  private removeHighlights(): void {
    this.highlightedElements.forEach(element => {
      element.classList.remove('tour-highlight');
    });
    this.highlightedElements = [];
  }

  startTour(): void {
    this.showWelcome = false;
    this.showTour = true;
    this.currentStep = 0;
    this.showCurrentStep();
  }

  startUsingApp(): void {
    this.showWelcome = false;
    this.showTour = true;
    this.currentStep = 0;
    this.showCurrentStep();
  }

  private showCurrentStep(): void {
    this.removeHighlights();
    this.calculateCurrentLine();
    this.addCurrentHighlight();

    // Auto-advance after 3 seconds
    this.autoAdvanceTimer = setTimeout(() => {
      this.advanceToNextStep();
    }, 1500);
  }

  advanceToNextStep(): void {
    // Clear the timer if it exists
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }

    if (this.currentStep < this.features.length - 1) {
      this.currentStep++;
      this.showCurrentStep();
    } else {
      // End tour after showing last feature
      this.tourService.endTour();
    }
  }

  onTourClick(): void {
    // Allow user to click anywhere to advance
    if (this.showTour && !this.showWelcome) {
      this.advanceToNextStep();
    }
  }

  private calculateCurrentLine(): void {
    this.svgLines = [];
    this.svgPaths = [];

    setTimeout(() => {
      const feature = this.features[this.currentStep];
      if (!feature) return;

      const target = document.querySelector(feature.targetSelector);
      const labelElement = document.querySelector('.feature-label');

      if (!target || !labelElement) return;

      const targetRect = target.getBoundingClientRect();
      const labelRect = labelElement.getBoundingClientRect();

      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      const labelCenterX = labelRect.left + labelRect.width / 2;
      const labelCenterY = labelRect.top + labelRect.height / 2;

      let labelX: number, labelY: number;

      const dx = targetX - labelCenterX;
      const dy = targetY - labelCenterY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          labelX = labelRect.right;
          labelY = labelCenterY;
        } else {
          labelX = labelRect.left;
          labelY = labelCenterY;
        }
      } else {
        if (dy > 0) {
          labelX = labelCenterX;
          labelY = labelRect.bottom;
        } else {
          labelX = labelCenterX;
          labelY = labelRect.top;
        }
      }

      const midX = (labelX + targetX) / 2;
      const midY = (labelY + targetY) / 2;
      const offsetX = (targetY - labelY) * 0.15;
      const offsetY = (labelX - targetX) * 0.15;
      const controlX = midX + offsetX;
      const controlY = midY + offsetY;

      const path = `M ${labelX} ${labelY} Q ${controlX} ${controlY}, ${targetX} ${targetY}`;
      this.svgPaths.push(path);

      this.svgLines.push({
        x1: 0,
        y1: 0,
        x2: targetX,
        y2: targetY
      });
    }, 100);
  }

  private addCurrentHighlight(): void {
    const feature = this.features[this.currentStep];
    if (!feature) return;

    const element = document.querySelector(feature.targetSelector);
    if (element) {
      element.classList.add('tour-highlight');
      this.highlightedElements.push(element);
    }
  }

  skipTour(): void {
    this.tourService.endTour();
  }

  closeTour(): void {
    this.tourService.endTour();
  }

  resetTour(): void {
    this.tourService.resetTour();
    window.location.reload();
  }

  private calculateAllLines(): void {
    this.svgLines = [];
    this.svgPaths = [];

    setTimeout(() => {
      const labelElements = document.querySelectorAll('.feature-label');

      this.features.forEach((feature, index) => {
        const target = document.querySelector(feature.targetSelector);
        const labelElement = labelElements[index];

        if (!target || !labelElement) return;

        const targetRect = target.getBoundingClientRect();
        const labelRect = labelElement.getBoundingClientRect();

        // Calculate target center point
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const labelCenterX = labelRect.left + labelRect.width / 2;
        const labelCenterY = labelRect.top + labelRect.height / 2;

        let labelX: number, labelY: number;
        let path = '';

        // Determine connection point from label based on target position
        const dx = targetX - labelCenterX;
        const dy = targetY - labelCenterY;

        // Choose label edge based on direction to target
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal connection
          if (dx > 0) {
            labelX = labelRect.right;
            labelY = labelCenterY;
          } else {
            labelX = labelRect.left;
            labelY = labelCenterY;
          }
        } else {
          // Vertical connection
          if (dy > 0) {
            labelX = labelCenterX;
            labelY = labelRect.bottom;
          } else {
            labelX = labelCenterX;
            labelY = labelRect.top;
          }
        }

        // Create a simple curved path with one control point for gentle curve
        const midX = (labelX + targetX) / 2;
        const midY = (labelY + targetY) / 2;

        // Offset control point perpendicular to the line for a gentle curve
        const offsetX = (targetY - labelY) * 0.15;
        const offsetY = (labelX - targetX) * 0.15;

        const controlX = midX + offsetX;
        const controlY = midY + offsetY;

        // Quadratic curve for simpler, smoother path
        path = `M ${labelX} ${labelY} Q ${controlX} ${controlY}, ${targetX} ${targetY}`;

        this.svgPaths.push(path);

        // Store endpoint for circle
        this.svgLines.push({
          x1: 0,
          y1: 0,
          x2: targetX,
          y2: targetY
        });
      });
    }, 100);
  }
}
