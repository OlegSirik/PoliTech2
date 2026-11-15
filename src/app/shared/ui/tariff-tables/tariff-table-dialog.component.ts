import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TariffTable, TariffVarOption } from './tariff-table.model';

export interface TariffTableDialogData {
  table?: TariffTable;
  isNew: boolean;
  vars: TariffVarOption[];
}

@Component({
  selector: 'pt-tariff-table-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule, MatAutocompleteModule],
  template: `
    <h2 mat-dialog-title>{{ data.isNew ? 'Добавить тарифную таблицу' : 'Редактировать тарифную таблицу' }}</h2>
    <div mat-dialog-content class="fields">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Код переменной</mat-label>
        <input matInput [(ngModel)]="table.varCode" required placeholder="K_Age" />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Название</mat-label>
        <input matInput [(ngModel)]="table.varName" required placeholder="Возрастной коэффициент" />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Альтернативное значение / код</mat-label>
        <input
          matInput
          [(ngModel)]="altInput"
          (ngModelChange)="onAltInput($event)"
          [matAutocomplete]="altAuto"
          placeholder="Выберите из списка или введите число" />
        <mat-autocomplete #altAuto="matAutocomplete" [displayWith]="displayAlt" (optionSelected)="onAltSelected($event)">
          @for (item of filteredVars; track item.varCode) {
            <mat-option [value]="item">{{ item.varCode }} — {{ item.varName }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Текст ошибки если переменная не найдена</mat-label>
        <input matInput [(ngModel)]="table.errorTextIfNotFound" placeholder="Введите текст ошибки если нужно прервать выполнение калькулятора" />
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
    .fields { display: grid; gap: var(--pt-space-3); min-width: min(520px, 80vw); padding-top: var(--pt-space-2); }
    mat-form-field { width: 100%; }
  `,
})
export class TariffTableDialogComponent {
  protected readonly table: TariffTable;
  protected altInput: string | TariffVarOption = '';
  protected filteredVars: TariffVarOption[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: TariffTableDialogData,
    private readonly ref: MatDialogRef<TariffTableDialogComponent, TariffTable>,
  ) {
    const source = data.table;
    this.table = source
      ? { ...source, columns: [...(source.columns ?? [])] }
      : { varCode: '', varName: '', altVarCode: '', altVarValue: null, errorTextIfNotFound: '', columns: [] };
    this.filteredVars = [...(data.vars ?? [])];
    this.altInput = this.initialAlt();
  }

  protected readonly displayAlt = (value: TariffVarOption | string | null): string => {
    if (!value || typeof value === 'string') {
      return value ?? '';
    }
    return `${value.varCode} — ${value.varName ?? ''}`.trim();
  };

  protected onAltSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as TariffVarOption;
    this.table.altVarCode = item.varCode;
    this.table.altVarValue = null;
  }

  protected onAltInput(value: string | TariffVarOption): void {
    if (typeof value !== 'string') {
      if (value) {
        this.table.altVarCode = value.varCode;
        this.table.altVarValue = null;
        this.altInput = this.displayAlt(value);
      }
      return;
    }
    this.altInput = value;
    const vars = this.data.vars ?? [];
    const query = value.trim().toLowerCase();
    this.filteredVars = query
      ? vars.filter((item) => item.varCode.toLowerCase().includes(query) || (item.varName ?? '').toLowerCase().includes(query))
      : [...vars];

    const exact = vars.find((item) => item.varCode === value.trim() || `${item.varCode} — ${item.varName ?? ''}`.trim() === value.trim());
    if (exact) {
      this.table.altVarCode = exact.varCode;
      this.table.altVarValue = null;
      return;
    }
    const numeric = Number(value.trim());
    if (value.trim() !== '' && Number.isFinite(numeric)) {
      this.table.altVarValue = numeric;
      this.table.altVarCode = '';
    } else if (value.trim() === '') {
      this.table.altVarCode = '';
      this.table.altVarValue = null;
    }
  }

  protected valid(): boolean {
    return !!(this.table.varCode?.trim() && this.table.varName?.trim());
  }

  protected submit(): void {
    if (!this.valid()) {
      return;
    }
    this.ref.close({
      ...this.table,
      varCode: this.table.varCode.trim(),
      varName: this.table.varName.trim(),
      altVarCode: this.table.altVarCode?.trim() || '',
      errorTextIfNotFound: this.table.errorTextIfNotFound?.trim() || '',
      columns: [...(this.table.columns ?? [])],
    });
  }

  private initialAlt(): string {
    if (this.table.altVarCode) {
      const found = this.data.vars?.find((item) => item.varCode === this.table.altVarCode);
      return found ? `${found.varCode} — ${found.varName ?? ''}`.trim() : this.table.altVarCode;
    }
    if (this.table.altVarValue != null && String(this.table.altVarValue).trim() !== '') {
      return String(this.table.altVarValue);
    }
    return '';
  }
}
