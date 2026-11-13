import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type PtActionKind = 'add' | 'edit' | 'delete';

@Component({
  selector: 'pt-action-button',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      type="button"
      [class.is-delete]="kind() === 'delete'"
      [disabled]="disabled()"
      [matTooltip]="label()"
      [attr.aria-label]="label()"
      (click)="press($event)">
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
  styles: `
    :host { display: inline-flex; vertical-align: middle; }
    .is-delete { color: var(--pt-color-danger); }
  `,
})
export class ActionButtonComponent {
  readonly kind = input.required<PtActionKind>();
  readonly disabled = input(false);

  readonly pressed = output<Event>();

  protected readonly icon = computed(() => ({ add: 'add', edit: 'edit', delete: 'delete' })[this.kind()]);
  protected readonly label = computed(() => ({ add: 'Добавить', edit: 'Редактировать', delete: 'Удалить' })[this.kind()]);

  protected press(event: Event): void {
    event.stopPropagation();
    this.pressed.emit(event);
  }
}
