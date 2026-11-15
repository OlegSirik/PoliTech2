import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface DialogField {
  key: string;
  label: string;
  kind?: 'text' | 'number' | 'checkbox' | 'textarea' | 'select';
  options?: string[];
}

export interface FieldsDialogData {
  title: string;
  fields: DialogField[];
  value: Record<string, unknown>;
}

@Component({
  selector: 'pt-fields-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="fields">
      @for (field of data.fields; track field.key) {
        @if (field.kind === 'checkbox') {
          <mat-checkbox [(ngModel)]="model[field.key]">{{ field.label }}</mat-checkbox>
        } @else {
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ field.label }}</mat-label>
            @if (field.kind === 'textarea') {
              <textarea matInput rows="3" [(ngModel)]="model[field.key]"></textarea>
            } @else if (field.kind === 'select') {
              <mat-select [(ngModel)]="model[field.key]">
                @for (option of field.options ?? []; track option) {
                  <mat-option [value]="option">{{ option }}</mat-option>
                }
              </mat-select>
            } @else {
              <input matInput [(ngModel)]="model[field.key]" [type]="field.kind === 'number' ? 'number' : 'text'">
            }
          </mat-form-field>
        }
      }
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="ref.close()">Отмена</button>
      <button mat-flat-button color="primary" type="button" (click)="save()">Сохранить</button>
    </div>
  `,
  styles: `
    .fields { display: grid; gap: 12px; min-width: min(440px, 80vw); padding-top: 8px; }
    mat-form-field { width: 100%; }
  `,
})
export class FieldsDialogComponent {
  protected readonly model: Record<string, string | number | boolean> = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: FieldsDialogData,
    protected readonly ref: MatDialogRef<FieldsDialogComponent, Record<string, unknown>>,
  ) {
    for (const field of data.fields) {
      const current = data.value[field.key];
      if (field.kind === 'checkbox') {
        this.model[field.key] = !!current;
      } else if (field.kind === 'number') {
        this.model[field.key] = current == null || current === '' ? 0 : Number(current);
      } else {
        this.model[field.key] = current == null ? '' : String(current);
      }
    }
  }

  protected save(): void {
    const result: Record<string, unknown> = { ...this.data.value };
    for (const field of this.data.fields) {
      const value = this.model[field.key];
      result[field.key] = field.kind === 'number' ? Number(value) : value;
    }
    this.ref.close(result);
  }
}
