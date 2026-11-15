import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TARIFF_DATA_TYPES, TARIFF_OPERATORS, TARIFF_SORT_ORDERS, TariffColumn, TariffVarOption } from './tariff-table.model';

export interface TariffColumnDialogData {
  column?: TariffColumn;
  isNew: boolean;
  vars: TariffVarOption[];
}

@Component({
  selector: 'pt-tariff-column-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.isNew ? 'Добавить колонку' : 'Редактировать колонку' }}</h2>
    <div mat-dialog-content class="fields">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Колонка №</mat-label>
        <input matInput [(ngModel)]="column.nr" required placeholder="1" />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Операция</mat-label>
        <mat-select [(ngModel)]="column.conditionOperator" required>
          @for (option of operators; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Код переменной</mat-label>
        <mat-select [(ngModel)]="column.varCode" required>
          @for (item of varOptions; track item.varCode) {
            <mat-option [value]="item.varCode">{{ item.varCode }} — {{ item.varName }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Тип данных</mat-label>
        <mat-select [(ngModel)]="column.varDataType" required>
          @for (option of dataTypes; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Сортировка</mat-label>
        <mat-select [(ngModel)]="column.sortOrder" required>
          @for (option of sortOrders; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Отмена</button>
      <button mat-flat-button color="primary" type="button" [class.pt-btn-accent]="data.isNew" [disabled]="!valid()" (click)="submit()">
        @if (data.isNew) {
          <mat-icon>add</mat-icon>
        }
        {{ data.isNew ? 'Добавить' : 'Сохранить' }}
      </button>
    </div>
  `,
  styles: `
    .fields {
      display: grid;
      gap: var(--pt-space-3);
      min-width: min(520px, 80vw);
    }
    mat-form-field { width: 100%; }
  `,
})
export class TariffColumnDialogComponent {
  protected readonly operators: string[];
  protected readonly sortOrders: string[];
  protected readonly dataTypes: string[];
  protected readonly varOptions: TariffVarOption[];
  protected readonly column: TariffColumn;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: TariffColumnDialogData,
    private readonly ref: MatDialogRef<TariffColumnDialogComponent, TariffColumn>,
  ) {
    this.column = data.column
      ? { ...data.column }
      : { varCode: '', varDataType: '', nr: '', conditionOperator: '', sortOrder: '' };
    this.operators = this.withCurrent(TARIFF_OPERATORS, this.column.conditionOperator);
    this.sortOrders = this.withCurrent(TARIFF_SORT_ORDERS, this.column.sortOrder);
    this.dataTypes = this.withCurrent(TARIFF_DATA_TYPES, this.column.varDataType);
    const vars = [...(data.vars ?? [])];
    if (this.column.varCode && !vars.some((item) => item.varCode === this.column.varCode)) {
      vars.unshift({ varCode: this.column.varCode, varName: '' });
    }
    this.varOptions = vars;
  }

  protected valid(): boolean {
    return !!(this.column.nr && this.column.varCode && this.column.varDataType && this.column.conditionOperator && this.column.sortOrder);
  }

  protected submit(): void {
    if (this.valid()) {
      this.ref.close({ ...this.column });
    }
  }

  private withCurrent(options: string[], current: string): string[] {
    const value = current?.trim();
    return value && !options.includes(value) ? [value, ...options] : options;
  }
}
