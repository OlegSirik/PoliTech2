import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { CalculatorVar, FormulaLine } from '../../core/api/catalog.models';

const CONDITION_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT_IN'];
const EXPRESSION_OPERATORS = ['+', '-', '*', '/', 'min', 'max'];
const POST_PROCESSORS = ['round2_up', 'round2_down', 'round2_ceiling', 'round2_floor', 'round2_halfup', 'round2_halfdown', 'round2_halfeven', 'NONE'];

export interface LineDialogData {
  isNew: boolean;
  line?: FormulaLine;
  vars: CalculatorVar[];
  varDisplayMode?: 'name' | 'code';
}

@Component({
  selector: 'pt-line-dialog',
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isNew ? 'Добавить строку формулы' : 'Редактировать строку формулы' }}</h2>
    <mat-dialog-content>
      <div class="row row-nr">
        <mat-form-field appearance="outline">
          <mat-label>№</mat-label>
          <input matInput [(ngModel)]="line.nr" required placeholder="1">
        </mat-form-field>
      </div>
      <mat-tab-group [(selectedIndex)]="selectedTabIndex">
        <mat-tab label="Формула">
          <div class="tab-content">
            <h3>Формула расчета: Результат = Аргумент1 Оператор Аргумент2</h3>
            <mat-form-field appearance="outline">
              <mat-label>Результат</mat-label>
              <input matInput [(ngModel)]="expressionResultInput" [matAutocomplete]="resultAuto" (input)="filterResult($event)" (ngModelChange)="syncVar($event, 'expressionResult')" required>
              <mat-autocomplete #resultAuto="matAutocomplete" [displayWith]="displayVar" (optionSelected)="pickVar($event.option.value, 'expressionResult', 'expressionResultInput')">
                @for (item of filteredResult; track item.varCode) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Аргумент 1</mat-label>
              <input matInput [(ngModel)]="expressionLeftInput" [matAutocomplete]="leftAuto" (input)="filterLeft($event)" (ngModelChange)="syncVar($event, 'expressionLeft')" required>
              <mat-autocomplete #leftAuto="matAutocomplete" [displayWith]="displayVar" (optionSelected)="pickVar($event.option.value, 'expressionLeft', 'expressionLeftInput')">
                @for (item of filteredLeft; track item.varCode) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <div class="pair">
              <mat-form-field appearance="outline">
                <mat-label>Оператор</mat-label>
                <mat-select [(ngModel)]="line.expressionOperator">
                  @for (option of expressionOperators; track option) {
                    <mat-option [value]="option">{{ option }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Аргумент 2</mat-label>
                <input matInput [(ngModel)]="expressionRightInput" [matAutocomplete]="rightAuto" (input)="filterRight($event)" (ngModelChange)="syncVar($event, 'expressionRight')">
                <mat-autocomplete #rightAuto="matAutocomplete" [displayWith]="displayVar" (optionSelected)="pickVar($event.option.value, 'expressionRight', 'expressionRightInput')">
                  @for (item of filteredRight; track item.varCode) {
                    <mat-option [value]="item">{{ label(item) }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Выполнить если">
          <div class="tab-content">
            <h3>Выполнить формулу если выполняется условие</h3>
            <mat-form-field appearance="outline">
              <mat-label>Что сравниваем</mat-label>
              <input matInput [(ngModel)]="conditionLeftInput" [matAutocomplete]="condLeftAuto" (input)="filterCondLeft($event)" (ngModelChange)="syncVar($event, 'conditionLeft')">
              <mat-autocomplete #condLeftAuto="matAutocomplete" [displayWith]="displayVar" (optionSelected)="pickVar($event.option.value, 'conditionLeft', 'conditionLeftInput')">
                @for (item of filteredCondLeft; track item.varCode) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <div class="pair">
              <mat-form-field appearance="outline">
                <mat-label>Как сравниваем</mat-label>
                <input matInput [(ngModel)]="conditionOperatorInput" [matAutocomplete]="opAuto" (input)="filterOperator($event)" (ngModelChange)="syncOperator($event)">
                <mat-autocomplete #opAuto="matAutocomplete" [displayWith]="displayOperator" (optionSelected)="pickOperator($event.option.value)">
                  @for (option of filteredOperators; track option) {
                    <mat-option [value]="option">{{ option }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>С чем сравниваем</mat-label>
                <input matInput [(ngModel)]="conditionRightInput" [matAutocomplete]="condRightAuto" (input)="filterCondRight($event)" (ngModelChange)="syncVar($event, 'conditionRight')">
                <mat-autocomplete #condRightAuto="matAutocomplete" [displayWith]="displayVar" (optionSelected)="pickVar($event.option.value, 'conditionRight', 'conditionRightInput')">
                  @for (item of filteredCondRight; track item.varCode) {
                    <mat-option [value]="item">{{ label(item) }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Округление">
          <div class="tab-content">
            <h3>Округление результата до 2 знаков после «.»</h3>
            <mat-form-field appearance="outline">
              <mat-label>Округление</mat-label>
              <mat-select [(ngModel)]="line.postProcessor">
                @for (option of postProcessors; track option) {
                  <mat-option [value]="option">{{ option }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (hasCondition && selectedTabIndex === 1) {
        <button mat-button type="button" (click)="clearCondition()">Очистить условие</button>
      }
      <button mat-stroked-button type="button" mat-dialog-close>Отмена</button>
      <button mat-flat-button color="primary" type="button" [class.pt-btn-accent]="data.isNew" [disabled]="!valid()" (click)="save()">
        @if (data.isNew) {
          <mat-icon>add</mat-icon>
        }
        {{ data.isNew ? 'Добавить' : 'Сохранить' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .row-nr { width: 120px; }
    .tab-content { display: grid; gap: 12px; padding-top: 16px; }
    .pair { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 16px; }
    h3 { margin: 0; font-size: var(--pt-font-sm); font-weight: var(--pt-weight-semibold); color: var(--pt-color-ink-soft); }
    mat-dialog-content { width: 920px; max-width: 100%; min-height: 280px; }
  `,
})
export class LineDialogComponent {
  protected readonly line: FormulaLine;
  protected readonly expressionOperators: string[];
  protected readonly postProcessors: string[];
  protected selectedTabIndex = 0;
  protected expressionResultInput = '';
  protected expressionLeftInput = '';
  protected expressionRightInput = '';
  protected conditionLeftInput = '';
  protected conditionOperatorInput = '';
  protected conditionRightInput = '';
  protected filteredResult: CalculatorVar[] = [];
  protected filteredLeft: CalculatorVar[] = [];
  protected filteredRight: CalculatorVar[] = [];
  protected filteredCondLeft: CalculatorVar[] = [];
  protected filteredCondRight: CalculatorVar[] = [];
  protected filteredOperators: string[] = [];

  protected readonly displayVar = (value: CalculatorVar | string | null): string => {
    if (value == null) {
      return '';
    }
    return typeof value === 'string' ? value : this.label(value);
  };

  protected readonly displayOperator = (value: string | null): string => value ?? '';

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: LineDialogData,
    private readonly dialogRef: MatDialogRef<LineDialogComponent, FormulaLine | undefined>,
  ) {
    const source = data.line;
    const text = (value: unknown): string => value == null ? '' : String(value);
    this.line = {
      nr: text(source?.nr),
      conditionLeft: text(source?.conditionLeft),
      conditionOperator: text(source?.conditionOperator),
      conditionRight: text(source?.conditionRight),
      expressionResult: text(source?.expressionResult),
      expressionLeft: text(source?.expressionLeft),
      expressionOperator: text(source?.expressionOperator),
      expressionRight: text(source?.expressionRight),
      postProcessor: text(source?.postProcessor) || 'NONE',
    };
    this.expressionOperators = this.withCurrent(EXPRESSION_OPERATORS, this.line.expressionOperator);
    this.postProcessors = this.withCurrent(POST_PROCESSORS, this.line.postProcessor ?? '');
    this.filteredResult = this.vars();
    this.filteredLeft = this.vars();
    this.filteredRight = this.vars();
    this.filteredCondLeft = this.vars();
    this.filteredCondRight = this.vars();
    this.filteredOperators = [...CONDITION_OPERATORS];
    this.expressionResultInput = this.inputFor(this.line.expressionResult);
    this.expressionLeftInput = this.inputFor(this.line.expressionLeft);
    this.expressionRightInput = this.inputFor(this.line.expressionRight);
    this.conditionLeftInput = this.inputFor(this.line.conditionLeft);
    this.conditionRightInput = this.inputFor(this.line.conditionRight);
    this.conditionOperatorInput = this.line.conditionOperator;
  }

  protected get hasCondition(): boolean {
    return !!(this.line.conditionLeft || this.line.conditionOperator || this.line.conditionRight);
  }

  protected label(item: CalculatorVar): string {
    if (this.data.varDisplayMode === 'code') {
      return item.varCode;
    }
    return item.varName || item.varCode;
  }

  protected filterResult(event: Event): void { this.filteredResult = this.matchVars(event); }
  protected filterLeft(event: Event): void { this.filteredLeft = this.matchVars(event); }
  protected filterRight(event: Event): void { this.filteredRight = this.matchVars(event); }
  protected filterCondLeft(event: Event): void { this.filteredCondLeft = this.matchVars(event); }
  protected filterCondRight(event: Event): void { this.filteredCondRight = this.matchVars(event); }

  protected filterOperator(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filteredOperators = query
      ? CONDITION_OPERATORS.filter((option) => option.toLowerCase().includes(query))
      : [...CONDITION_OPERATORS];
  }

  protected pickVar(item: CalculatorVar, field: VarField, input: InputKey): void {
    this.line[field] = item.varCode;
    this[input] = this.label(item);
  }

  protected pickOperator(option: string): void {
    this.line.conditionOperator = option;
    this.conditionOperatorInput = option;
  }

  protected syncVar(value: unknown, field: VarField): void {
    if (value && typeof value === 'object' && 'varCode' in value) {
      this.line[field] = String((value as CalculatorVar).varCode ?? '');
      return;
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) {
      this.line[field] = '';
      return;
    }
    const match = this.vars().find((item) => item.varCode === text || item.varName === text || this.label(item) === text);
    this.line[field] = match ? match.varCode : text;
  }

  protected syncOperator(value: unknown): void {
    if (typeof value !== 'string') {
      return;
    }
    const text = value.trim();
    this.line.conditionOperator = !text || CONDITION_OPERATORS.includes(text) ? text : '';
  }

  protected clearCondition(): void {
    this.line.conditionLeft = '';
    this.line.conditionOperator = '';
    this.line.conditionRight = '';
    this.conditionLeftInput = '';
    this.conditionOperatorInput = '';
    this.conditionRightInput = '';
  }

  protected valid(): boolean {
    return !!(this.line.nr.trim() && this.line.expressionResult.trim() && this.line.expressionLeft.trim());
  }

  protected save(): void {
    if (!this.valid()) {
      return;
    }
    this.dialogRef.close(this.result());
  }

  protected result(): FormulaLine {
    return {
      ...this.line,
      nr: this.line.nr.trim(),
      postProcessor: !this.line.postProcessor || this.line.postProcessor === 'NONE' ? '' : this.line.postProcessor,
    };
  }

  private vars(): CalculatorVar[] {
    return (this.data.vars ?? []).filter((item) => !!item?.varCode);
  }

  private inputFor(code: string): string {
    const found = this.vars().find((item) => item.varCode === code);
    return found ? this.label(found) : (code ?? '');
  }

  private matchVars(event: Event): CalculatorVar[] {
    const query = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (!query) {
      return this.vars();
    }
    return this.vars().filter((item) =>
      item.varCode.toLowerCase().includes(query) || (item.varName ?? '').toLowerCase().includes(query));
  }

  private withCurrent(options: string[], current: string): string[] {
    return current && !options.includes(current) ? [current, ...options] : options;
  }
}

type VarField = 'expressionResult' | 'expressionLeft' | 'expressionRight' | 'conditionLeft' | 'conditionRight';
type InputKey = 'expressionResultInput' | 'expressionLeftInput' | 'expressionRightInput' | 'conditionLeftInput' | 'conditionRightInput';
