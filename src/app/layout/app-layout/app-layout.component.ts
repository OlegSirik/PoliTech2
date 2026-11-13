import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { AppToolbarComponent } from '../app-toolbar/app-toolbar.component';

const SIDEBAR_KEY = 'politech2.sidebar';

@Component({
  selector: 'pt-app-layout',
  imports: [RouterOutlet, AppSidebarComponent, AppToolbarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  protected readonly collapsed = signal(this.readCollapsed());

  protected setCollapsed(value: boolean): void {
    this.collapsed.set(value);
    localStorage.setItem(SIDEBAR_KEY, value ? '1' : '0');
  }

  private readCollapsed(): boolean {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  }
}
