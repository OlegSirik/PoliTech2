import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PolicyVar } from '../../core/api/catalog.models';
import { RefDataItem, RefDict, RefDictsService } from '../../core/api/refdicts.service';

@Component({
  selector: 'pt-schema-var-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Переменная схемы</h2>
    <div mat-dialog-content class="body">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Код</mat-label>
        <input matInput [(ngModel)]="model.varCode" readonly>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Название</mat-label>
        <input matInput [(ngModel)]="model.varName">
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Тип</mat-label>
        <input matInput [(ngModel)]="model.varType" readonly>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Тип данных</mat-label>
        <input matInput [(ngModel)]="model.varDataType" readonly>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Справочник</mat-label>
        <input matInput [value]="listLabel" readonly>
      </mat-form-field>
      @if (listCode) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Значения</mat-label>
          <mat-select multiple [(ngModel)]="selectedValues" (ngModelChange)="onValues($event)">
            @for (item of items; track item.code) {
              <mat-option [value]="item.code">{{ item.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      } @else {
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Значение</mat-label>
          <input matInput [(ngModel)]="model.varValue">
        </mat-form-field>
      }
      <mat-checkbox [(ngModel)]="model.isTarifFactor">Тарифный фактор</mat-checkbox>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="ref.close()">Отмена</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!model.varCode.trim() || !model.varName.trim()" (click)="save()">Сохранить</button>
    </div>
  `,
  styles: `.body { display: grid; gap: 12px; min-width: min(460px, 80vw); padding-top: 8px; } mat-form-field { width: 100%; }`,
})
export class SchemaVarDialogComponent implements OnInit {
  private readonly dictsApi = inject(RefDictsService);
  private readonly data = inject<{ variable: PolicyVar }>(MAT_DIALOG_DATA);
  protected readonly model: PolicyVar;
  protected readonly listCode: string;
  protected listLabel = '—';
  protected items: RefDataItem[] = [];
  protected selectedValues: string[] = [];
  private dicts: RefDict[] = [];

  constructor(protected readonly ref: MatDialogRef<SchemaVarDialogComponent, PolicyVar>) {
    const variable = this.data.variable;
    this.model = {
      ...variable,
      varPath: variable.varPath ?? '',
      varName: variable.varName ?? '',
      varCode: variable.varCode ?? '',
      varDataType: variable.varDataType ?? '',
      varValue: variable.varValue ?? '',
      varType: variable.varType ?? '',
      isTarifFactor: !!variable.isTarifFactor,
    };
    this.listCode = (variable.varList ?? '').trim();
    this.selectedValues = (variable.varValue ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  }

  ngOnInit(): void {
    if (!this.listCode) {
      return;
    }
    this.dictsApi.listDicts().subscribe({
      next: (dicts) => {
        this.dicts = dicts ?? [];
        this.listLabel = this.dicts.find((item) => item.code === this.listCode)?.name ?? this.listCode;
      },
    });
    this.dictsApi.listItems(this.listCode).subscribe({
      next: (items) => { this.items = items ?? []; },
      error: () => { this.items = []; },
    });
  }

  protected onValues(codes: string[]): void {
    this.selectedValues = codes;
    this.model.varValue = codes.join(',');
  }

  protected save(): void {
    this.model.varName = this.model.varName.trim();
    if (!this.listCode) {
      this.model.varValue = (this.model.varValue ?? '').trim();
    }
    this.ref.close(this.model);
  }
}
