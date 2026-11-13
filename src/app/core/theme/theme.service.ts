import { Injectable, signal } from '@angular/core';

export type PtTheme = 'light' | 'dark';

const STORAGE_KEY = 'pt-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<PtTheme>(readTheme());

  constructor() {
    applyTheme(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: PtTheme): void {
    this.theme.set(theme);
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode can reject storage; the current page still switches.
    }
  }
}

function readTheme(): PtTheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: PtTheme): void {
  document.documentElement.dataset['theme'] = theme;
  document.documentElement.style.colorScheme = theme;
}
