import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ShortcutItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  shortcuts: ShortcutItem[] = [
    { key: 'F1', label: 'Velg firma' },
    { key: 'F5', label: 'Driftsmeny' },
    { key: 'F6', label: 'Meldinger' },
    { key: 'F10', label: 'Kommando-linje' }
  ];
}
