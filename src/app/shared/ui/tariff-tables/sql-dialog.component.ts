import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'pt-sql-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>SQL</h2>
    <div mat-dialog-content>
      <pre class="sql-text">{{ data.sql }}</pre>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" mat-dialog-close>Закрыть</button>
    </div>
  `,
  styles: `
    .sql-text {
      margin: 0;
      max-height: 60vh;
      overflow: auto;
      white-space: pre-wrap;
      padding: var(--pt-space-3);
      border-radius: var(--pt-radius-sm);
      background: var(--pt-color-surface-muted);
      color: var(--pt-color-ink);
      font-family: var(--pt-font-mono);
      font-size: var(--pt-font-sm);
    }
    [mat-dialog-content] { min-width: min(640px, 80vw); }
  `,
})
export class SqlDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) protected readonly data: { sql: string }) {}
}
