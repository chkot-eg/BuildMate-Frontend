import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeatureTourService {
  private readonly STORAGE_KEY = 'app_feature_tour_seen';
  private showTour$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  getShowTour() {
    return this.showTour$.asObservable();
  }

  startTour(): void {
    this.showTour$.next(true);
  }

  endTour(): void {
    this.showTour$.next(false);
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  hasSeenTour(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  resetTour(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
