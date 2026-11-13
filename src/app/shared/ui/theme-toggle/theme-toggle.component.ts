import { Component, computed, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'pt-theme-toggle',
  imports: [MatSlideToggleModule],
  template: `
    <mat-slide-toggle
      color="primary"
      [checked]="dark()"
      (change)="theme.set($event.checked ? 'dark' : 'light')"
      aria-label="Тёмная тема">
      Тёмная тема
    </mat-slide-toggle>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      color: var(--pt-color-ink);
      font-size: var(--pt-font-sm);
      white-space: nowrap;
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly dark = computed(() => this.theme.theme() === 'dark');
}
