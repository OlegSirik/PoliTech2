import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantContext {
  private readonly value = signal('');

  readonly code = this.value.asReadonly();

  set(code: string): void {
    this.value.set(code);
  }
}
