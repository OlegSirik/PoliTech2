import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NAV_GROUPS } from '../../core/navigation/nav.config';

@Component({
  selector: 'pt-app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
  host: {
    '[class.is-collapsed]': 'collapsed()',
  },
})
export class AppSidebarComponent {
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();
  protected readonly groups = NAV_GROUPS;

  protected toggle(): void {
    this.collapsedChange.emit(!this.collapsed());
  }
}
