import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface MenuItem {
  label: string;
  icon?: string;
  children?: string[];
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'DAGLIG DRIFT',
      active: true,
      children: [
        'PRISER - RABATT - BONUS',
        'VAREMOTTAK - ETIKETTER - KJERREKONTOR',
        'VEDLIKEHOLD',
        'DIVERSE OPPGAVER',
        'SALGSSTATISTIKK'
      ]
    },
    {
      label: 'ORDREOPPGAVER',
      children: [
        'Reg./vedlikehold tilbud/ordre',
        'Eksterne ordre',
        'Tilbudsoppfølging',
        'Ordreoppfølging',
        'Utskrift av kontroll',
        'Utskrift Ordreinngang',
        'Utskrift Tilbudsstatistikk',
        'Utskrift av leveranseplanleggingsliste'
      ]
    },
    {
      label: 'FAKTURAOPPGAVER',
      children: [
        'Omtekjøring av faktura-bunt',
        'Utskrift av faktura-journal',
        'Utskrift av faktura-kopi',
        'Behandle kort fakturarer',
        'Betale kort bonger',
        'Generere utgående fakturfiler',
        'Overføring til økonomi'
      ]
    },
    {
      label: 'SPØRRING',
      children: [
        'Fakturaregister',
        'Varepris',
        'Statistikk',
        'Ikke-bekreftede bestillinger',
        'Restede ordre til levering'
      ]
    },
    {
      label: 'VEDLIKEHOLD',
      children: [
        'Kunder',
        'Kundeprosjekt',
        'Leverandører',
        'Varer'
      ]
    }
  ];

  expandedItems: Set<string> = new Set(['DAGLIG DRIFT']);

  toggleExpand(item: MenuItem): void {
    if (this.expandedItems.has(item.label)) {
      this.expandedItems.delete(item.label);
    } else {
      this.expandedItems.add(item.label);
    }
  }

  isExpanded(item: MenuItem): boolean {
    return this.expandedItems.has(item.label);
  }
}