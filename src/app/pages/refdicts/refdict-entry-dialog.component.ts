import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RefDictEntryDialogData {
  title: string;
  code: string;
  name: string;
  isNew: boolean;
}

export interface RefDictEntryDialogResult {
  code: string;
  name: string;
}

@Component({
  selector: 'pt-refdict-entry-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
        <mat-label>Код</mat-label>
        <input matInput [(ngModel)]="model.code" [readonly]="!data.isNew" required>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
        <mat-label>Название</mat-label>
        <input matInput [(ngModel)]="model.name" required>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancel()">Отменить</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!isValid()" (click)="save()">Сохранить</button>
    </div>
  `,
  styles: `
    h2 { letter-spacing: var(--pt-tracking-tight); }
    .dialog-content { display: flex; flex-direction: column; gap: var(--pt-space-3); padding-top: var(--pt-space-3); min-width: min(420px, 80vw); }
    .full { width: 100%; }
  `,
})
export class RefDictEntryDialogComponent {
  model: RefDictEntryDialogResult;

  constructor(
    private readonly dialogRef: MatDialogRef<RefDictEntryDialogComponent, RefDictEntryDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: RefDictEntryDialogData,
  ) {
    this.model = { code: data.code ?? '', name: data.name ?? '' };
  }

  isValid(): boolean {
    return !!this.model.code.trim() && !!this.model.name.trim();
  }

  save(): void {
    if (!this.isValid()) {
      return;
    }
    this.dialogRef.close({ code: this.model.code.trim(), name: this.model.name.trim() });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
