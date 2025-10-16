import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <img src="logo.png" alt="Company Logo" class="logo-image">
            <!-- <svg width="80" height="80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="logo-image">
              <rect x="10" y="10" width="85" height="85" rx="8" fill="#404F5E"/>
              <text x="52" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">E</text>
              
              <rect x="105" y="10" width="85" height="85" rx="8" fill="#E31E24"/>
              
              <rect x="10" y="105" width="85" height="85" rx="8" fill="#E31E24"/>
              
              <rect x="105" y="105" width="85" height="85" rx="8" fill="#404F5E"/>
              <text x="147" y="165" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">G</text>
            </svg> -->
          </div>
        </div>
        
        <nav class="top-nav">
          <a href="#" class="nav-link active">SIGNOFF</a>
          <a href="#" class="nav-link">ØKONOMI</a>
          <a href="#" class="nav-link highlighted">ORDRE/FAKTURA</a>
          <a href="#" class="nav-link">BUTIKK</a>
          <a href="#" class="nav-link">LAGER/INNKJØP</a>
          <a href="#" class="nav-link">VAREADMINISTRASJON</a>
        </nav>
        
        <div class="header-actions">
          <button class="search-btn">
            <span>🔍</span>
          </button>
          <div class="economics-info">
            <span class="economics-label">ØKONOMIRUTINER</span>
          </div>
        </div>
      </div>
    </header>
  `,
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent { }