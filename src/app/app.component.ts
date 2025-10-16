import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FloatingChatButtonComponent } from './components/floating-chat/floating-chat-button.component';
import { FloatingChatPanelComponent } from './components/floating-chat/floating-chat-panel.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FloatingChatButtonComponent,
    FloatingChatPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'EG System';
}
