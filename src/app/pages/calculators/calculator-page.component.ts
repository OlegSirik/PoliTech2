import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import {
  CalculatorCoefficient,
  CalculatorDocument,
  CalculatorFormula,
  CalculatorTemplate,
  CalculatorVar,
  CoefficientDataRow,
  FormulaLine,
  emptyCalculator,
  normalizeCalculator,
} from '../../core/api/catalog.models';
import { downloadJson, pickJsonFile } from '../../core/api/json-file';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { TariffTablesComponent } from '../../shared/ui/tariff-tables/tariff-tables.component';
import { TariffTable } from '../../shared/ui/tariff-tables/tariff-table.model';
import { FieldsDialogComponent } from '../../shared/ui/fields-dialog/fields-dialog.component';

@Component({
  selector: 'pt-calculator-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    PageHeaderComponent,
    TariffTablesComponent,
  ],
  templateUrl: './calculator-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class CalculatorPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

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

  protected readable(): string {
    return this.calc.formulas.map((formula) => {
      const lines = (formula.lines ?? []).map((line) =>
        `${line.nr}. ${line.conditionLeft} ${line.conditionOperator} ${line.conditionRight} => ${line.expressionResult} = ${line.expressionLeft} ${line.expressionOperator} ${line.expressionRight}`);
      return `${formula.varCode} ${formula.varName}\n${lines.join('\n')}`;
    }).join('\n\n');
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

  protected addVar(): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: {
        title: 'Переменная',
        fields: [
          { key: 'varCode', label: 'Код' },
          { key: 'varName', label: 'Название' },
          { key: 'varKind', label: 'Вид (POLICY, CONST, COEFFICIENT, VAR, COVER)' },
          { key: 'varDataType', label: 'Тип данных' },
          { key: 'varValue', label: 'Значение' },
        ],
        value: { varKind: 'VAR', varDataType: 'DECIMAL' },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.calc.vars = [...this.calc.vars, result as unknown as CalculatorVar];
      this.touch();
    });
  }

  protected deleteVar(item: CalculatorVar): void {
    this.calc.vars = this.calc.vars.filter((row) => row !== item);
    this.touch();
  }

  protected addFormula(): void {
    this.calc.formulas = [...this.calc.formulas, { varCode: '', varName: '', lines: [] }];
    this.formulaIndex = this.calc.formulas.length - 1;
    this.touch();
  }

  protected addLine(): void {
    const formula = this.formula();
    if (!formula) {
      return;
    }
    const line: FormulaLine = {
      nr: String(formula.lines.length + 1),
      conditionLeft: '',
      conditionOperator: '',
      conditionRight: '',
      expressionResult: formula.varCode,
      expressionLeft: '',
      expressionOperator: '',
      expressionRight: '',
    };
    formula.lines = [...formula.lines, line];
    this.touch();
  }

  protected deleteLine(line: FormulaLine): void {
    const formula = this.formula();
    if (!formula) {
      return;
    }
    formula.lines = formula.lines.filter((item) => item !== line);
    this.touch();
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

  protected addDataRow(): void {
    const width = this.coefficient()?.columns.length ?? 1;
    this.dataRows = [...this.dataRows, { conditionValue: Array.from({ length: width }, () => ''), resultValue: 0 }];
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

  protected back(): void {
    void this.router.navigate(['/products', this.calc.productId, 'versions', this.calc.versionNo]);
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
