import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import {
  CalculatorCoefficient,
  CalculatorDocument,
  CalculatorFormula,
  CalculatorTemplate,
  CalculatorVar,
  CoefficientDataRow,
  PolicyVar,
  FormulaLine,
  emptyCalculator,
  normalizeCalculator,
} from '../../core/api/catalog.models';
import { downloadJson, pickJsonFile } from '../../core/api/json-file';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { LlmPromptComponent } from '../../shared/ui/llm-prompt/llm-prompt.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { TariffTablesComponent } from '../../shared/ui/tariff-tables/tariff-tables.component';
import { TariffTable } from '../../shared/ui/tariff-tables/tariff-table.model';
import { FieldsDialogComponent } from '../../shared/ui/fields-dialog/fields-dialog.component';
import { LineDialogComponent } from './line-dialog.component';

@Component({
  selector: 'pt-calculator-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    ActionButtonComponent,
    LlmPromptComponent,
    PageHeaderComponent,
    TariffTablesComponent,
  ],
  templateUrl: './calculator-page.component.html',
  styleUrl: '../catalog/sheet.scss',
  styles: `
    .mode { height: 32px; }
    .mode .mat-button-toggle-label-content { line-height: 32px; padding: 0 10px; }
    .constants { display: grid; gap: var(--pt-space-3); }
    .constant {
      display: flex;
      align-items: center;
      gap: var(--pt-space-4);
      padding: var(--pt-space-3);
      border: 1px solid var(--pt-color-line);
      border-radius: var(--pt-radius-sm);
    }
    .constant span { flex: 1; font-weight: var(--pt-weight-medium); }
    .constant mat-form-field { width: 220px; }
    .tariff-lines { display: grid; }
    .tariff-line {
      display: grid;
      grid-template-columns: 2.5rem minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--pt-space-3);
      padding: 6px 0;
      border-bottom: 1px solid var(--pt-color-line);
      font-size: var(--pt-font-sm);
    }
    .tariff-line__nr { color: var(--pt-color-ink-soft); font-variant-numeric: tabular-nums; }
    .tariff-line span:nth-child(2) { min-width: 0; white-space: pre-wrap; }
    .tariff-line__actions { display: flex; align-items: center; }
  `,
})
export class CalculatorPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly productName = signal('');
  protected readonly packageName = signal('');
  protected readonly agentOpen = signal(false);
  protected readonly tablesAgentOpen = signal(false);
  protected readonly showNames = signal(true);
  protected readonly missing = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly asking = signal(false);
  protected calc: CalculatorDocument = emptyCalculator('', '', '');
  protected templates: CalculatorTemplate[] = [];
  protected templateId: number | null = null;
  protected formulaIndex = 0;
  protected dataRows: CoefficientDataRow[] = [];
  private selectedCoefficient: CalculatorCoefficient | null = null;
  protected productVars: PolicyVar[] = [];
  private lob = '';

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id') ?? '';
    const versionNo = this.route.snapshot.paramMap.get('versionNo') ?? '';
    const packageNo = this.route.snapshot.paramMap.get('packageNo') ?? '';
    this.calc = emptyCalculator(productId, versionNo, packageNo);
    this.api.product(Number(productId), Number(versionNo)).subscribe({
      next: (product) => {
        this.lob = product.lob;
        this.calc.productCode = product.code;
        this.productName.set(product.name || product.code);
        const pkg = product.packages?.find((item) => item.code === this.calc.packageNo);
        this.productVars = product.vars ?? [];
        this.packageName.set(pkg?.name || pkg?.code || this.calc.packageNo);
        this.loadTemplates();
      },
      error: () => undefined,
    });
    this.load();
  }

  protected formula(): CalculatorFormula | null {
    return this.calc.formulas[this.formulaIndex] ?? null;
  }

  protected coefficient(): CalculatorCoefficient | null {
    return this.selectedCoefficient;
  }

  protected tariffLines(): TariffLineRow[] {
    return this.calc.formulas.flatMap((formula) =>
      (formula.lines ?? []).map((line) => ({ formula, line, text: this.lineText(line) })));
  }

  protected addTariffLine(): void {
    const formula = this.formula() ?? this.ensureFormula();
    const numbers = (formula.lines ?? []).map((line) => Number(line.nr)).filter((value) => Number.isFinite(value));
    const nr = String((numbers.length ? Math.max(...numbers) : 0) + 1);
    this.openLineDialog(formula, {
      nr,
      conditionLeft: '',
      conditionOperator: '',
      conditionRight: '',
      expressionResult: '',
      expressionLeft: '',
      expressionOperator: '',
      expressionRight: '',
    }, true);
  }

  protected editTariffLine(row: TariffLineRow): void {
    this.openLineDialog(row.formula, row.line, false);
  }

  protected deleteTariffLine(row: TariffLineRow): void {
    row.formula.lines = (row.formula.lines ?? []).filter((item) => item !== row.line);
    this.touch();
  }

  private lineText(line: FormulaLine): string {
    const names = new Map(this.calc.vars.map((item) => [item.varCode, item.varName || item.varCode]));
    const label = (value: string): string => {
      const text = value ?? '';
      if (!text || !this.showNames()) {
        return text;
      }
      return names.get(text) || text;
    };
    const left = label(line.expressionLeft);
    const right = label(line.expressionRight);
    let expression = left;
    if (line.expressionOperator === 'min') {
      expression = `Меньшее из (${left}, ${right})`;
    } else if (line.expressionOperator === 'max') {
      expression = `Большее из (${left}, ${right})`;
    } else if (line.expressionOperator && line.expressionRight) {
      expression = `${left} ${line.expressionOperator} ${right}`;
    }
    if (line.postProcessor) {
      expression = `${expression} >> ${line.postProcessor}`;
    }
    const assignment = `${label(line.expressionResult)} = ${expression}`;
    if (line.conditionOperator) {
      const condition = `${label(line.conditionLeft)} ${line.conditionOperator} ${label(line.conditionRight)}`.trim();
      return `Если (${condition}) то ${assignment}`;
    }
    return assignment;
  }

  private ensureFormula(): CalculatorFormula {
    const formula: CalculatorFormula = { varCode: '', varName: '', lines: [] };
    this.calc.formulas = [...this.calc.formulas, formula];
    this.formulaIndex = this.calc.formulas.length - 1;
    return formula;
  }

  private openLineDialog(formula: CalculatorFormula, line: FormulaLine, isNew: boolean): void {
    const vars = [...this.calc.vars].sort((a, b) => a.varCode.localeCompare(b.varCode));
    this.dialog.open(LineDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      data: {
        isNew,
        line,
        vars,
        varDisplayMode: this.showNames() ? 'name' : 'code',
      },
    }).afterClosed().subscribe((result: FormulaLine | undefined) => {
      if (!result) {
        return;
      }
      if (isNew) {
        formula.lines = [...(formula.lines ?? []), result];
      } else {
        Object.assign(line, result);
      }
      this.touch();
    });
  }

  protected load(): void {
    this.api.calculator(this.calc.productId, this.calc.versionNo, this.calc.packageNo).subscribe({
      next: (value) => {
        this.calc = normalizeCalculator(value);
        this.missing.set(false);
        this.dirty.set(false);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.missing.set(true);
          return;
        }
        this.snack.open(bffErrorMessage(error, 'Калькулятор недоступен'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected create(templateId?: number | null): void {
    this.api.createCalculator(this.calc.productId, this.calc.versionNo, this.calc.packageNo, templateId).subscribe({
      next: (value) => {
        this.calc = normalizeCalculator({ ...this.calc, ...value });
        this.missing.set(false);
        this.snack.open('Калькулятор создан', 'Закрыть', { duration: 2000 });
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось создать калькулятор'), 'Закрыть', { duration: 3500 }),
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.api.updateCalculator(this.calc).subscribe({
      next: (value) => {
        this.calc = normalizeCalculator(value);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить калькулятор'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected exportFile(): void {
    downloadJson(`calculator_${this.calc.packageNo}.json`, this.calc);
  }

  protected async importFile(): Promise<void> {
    const payload = await pickJsonFile();
    if (!payload || typeof payload !== 'object') {
      return;
    }
    const imported = normalizeCalculator(payload as CalculatorDocument);
    imported.productId = this.calc.productId;
    imported.versionNo = this.calc.versionNo;
    imported.packageNo = this.calc.packageNo;
    imported.id = this.calc.id;
    this.calc = imported;
    this.touch();
  }

  protected makeTemplate(): void {
    const id = Number(this.calc.id);
    if (!id || !this.lob) {
      this.snack.open('Сначала сохраните калькулятор', 'Закрыть', { duration: 2500 });
      return;
    }
    this.api.createTemplate(this.lob, id).subscribe({
      next: () => {
        this.snack.open('Шаблон создан', 'Закрыть', { duration: 2000 });
        this.loadTemplates();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось создать шаблон'), 'Закрыть', { duration: 3500 }),
    });
  }

  protected setLlmText(text: string): void {
    this.calc.llmText = text;
    this.touch();
  }

  protected askLlm(): void {
    const text = (this.calc.llmText || '').trim();
    if (!text) {
      return;
    }
    this.asking.set(true);
    this.api.assistCalculator(this.calc.productId, this.calc.versionNo, this.calc.packageNo, text).subscribe({
      next: (response) => {
        this.asking.set(false);
        if (response.calculator) {
          this.calc = normalizeCalculator({ ...this.calc, ...response.calculator, llmText: this.calc.llmText });
          this.touch();
        }
        this.snack.open(response.message || 'Ответ LLM получен', 'Закрыть', { duration: 2500 });
      },
      error: (error: unknown) => {
        this.asking.set(false);
        this.snack.open(bffErrorMessage(error, 'LLM не ответил'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected constants(): CalculatorVar[] {
    return this.calc.vars.filter((item) => item.varKind === 'CONST');
  }

  protected editableVar(item: CalculatorVar): boolean {
    return item.varKind === 'VAR' || item.varKind === 'CONST';
  }

  protected addVar(): void {
    this.openVarDialog('Добавить переменную', { varKind: 'VAR', varDataType: 'STRING', varValue: '' });
  }

  protected editVar(item: CalculatorVar): void {
    if (!this.editableVar(item)) {
      return;
    }
    this.openVarDialog('Редактировать переменную', item, item);
  }

  protected setConstant(item: CalculatorVar, value: string): void {
    item.varValue = value;
    this.touch();
  }

  protected deleteVar(item: CalculatorVar): void {
    if (!this.editableVar(item)) {
      return;
    }
    this.calc.vars = this.calc.vars.filter((row) => row !== item);
    this.touch();
  }

  private openVarDialog(title: string, value: Partial<CalculatorVar>, current?: CalculatorVar): void {
    const types = ['STRING', 'NUMBER'];
    const dataType = value.varDataType ?? 'STRING';
    this.dialog.open(FieldsDialogComponent, {
      width: '640px',
      data: {
        title,
        fields: [
          { key: 'varCode', label: 'Код переменной' },
          { key: 'varName', label: 'Название переменной' },
          { key: 'varKind', label: 'Тип переменной', kind: 'select', options: ['VAR', 'CONST'] },
          { key: 'varDataType', label: 'Тип данных', kind: 'select', options: types.includes(dataType) ? types : [dataType, ...types] },
          { key: 'varValue', label: 'Значение переменной' },
        ],
        value,
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const next: CalculatorVar = {
        varCode: String(result['varCode'] ?? '').trim(),
        varName: String(result['varName'] ?? '').trim(),
        varKind: String(result['varKind'] ?? 'VAR'),
        varDataType: String(result['varDataType'] ?? 'STRING'),
        varValue: String(result['varValue'] ?? ''),
      };
      if (!next.varCode || !next.varName) {
        this.snack.open('Укажите код и название', 'Закрыть', { duration: 2500 });
        return;
      }
      if (this.calc.vars.some((item) => item !== current && item.varCode === next.varCode)) {
        this.snack.open('Код переменной должен быть уникальным', 'Закрыть', { duration: 3000 });
        return;
      }
      if (current) {
        Object.assign(current, next);
      } else {
        this.calc.vars = [...this.calc.vars, next];
      }
      this.touch();
    });
  }

  protected onTariffTables(tables: TariffTable[]): void {
    this.calc.coefficients = tables as CalculatorCoefficient[];
    if (this.selectedCoefficient && !this.calc.coefficients.includes(this.selectedCoefficient)) {
      this.selectedCoefficient = null;
      this.dataRows = [];
    }
    this.touch();
  }

  protected selectCoefficient(table: TariffTable | null): void {
    this.selectedCoefficient = table as CalculatorCoefficient | null;
    this.dataRows = [];
    if (!table || this.calc.id == null) {
      return;
    }
    this.api.coefficientData(this.calc.id, table.varCode).subscribe({
      next: (rows) => { this.dataRows = rows ?? []; },
      error: () => { this.dataRows = []; },
    });
  }

  protected replaceData(rows: CoefficientDataRow[]): void {
    this.dataRows = rows;
  }

  protected saveData(): void {
    const coefficient = this.coefficient();
    if (!coefficient || this.calc.id == null) {
      return;
    }
    this.api.saveCoefficientData(this.calc.id, coefficient.varCode, this.dataRows).subscribe({
      next: (rows) => {
        this.dataRows = rows ?? [];
        this.snack.open('Таблица сохранена', 'Закрыть', { duration: 2000 });
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось сохранить таблицу'), 'Закрыть', { duration: 3500 }),
    });
  }

  protected productRoute(): string {
    return `/products/${this.calc.productId}/versions/${this.calc.versionNo}`;
  }

  private loadTemplates(): void {
    if (!this.lob) {
      return;
    }
    this.api.templates(this.lob).subscribe({
      next: (items) => { this.templates = items ?? []; },
      error: () => { this.templates = []; },
    });
  }
}

interface TariffLineRow {
  formula: CalculatorFormula;
  line: FormulaLine;
  text: string;
}
