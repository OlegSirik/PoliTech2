import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  InsuranceCompany,
  PackageFile,
  PolicyForm,
  PolicyVar,
  ProductCelRule,
  ProductCover,
  ProductPackage,
  ProductVersion,
  QuoteValidator,
  emptyProduct,
  normalizeProduct,
} from '../../core/api/catalog.models';
import { downloadJson, pickJsonFile } from '../../core/api/json-file';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { LlmPromptComponent } from '../../shared/ui/llm-prompt/llm-prompt.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { FieldsDialogComponent } from '../../shared/ui/fields-dialog/fields-dialog.component';
import { SchemaTreeComponent } from './schema-tree.component';
import { SchemaVarDialogComponent } from './schema-var-dialog.component';

@Component({
  selector: 'pt-product-version-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderComponent,
    ActionButtonComponent,
    LlmPromptComponent,
    SchemaTreeComponent,
  ],
  templateUrl: './product-version-page.component.html',
  styleUrls: ['../catalog/sheet.scss', './product-packages.scss', './product-side.scss'],
})
export class ProductVersionPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly agentOpen = signal(false);
  protected readonly asking = signal(false);
  protected packagePrompt = '';
  protected product: ProductVersion = emptyProduct();
  protected companies: InsuranceCompany[] = [];
  protected forms: PolicyForm[] = [];
  protected readonly openPackages = signal<ReadonlySet<string>>(new Set());
  private readonly coverNames = signal<ReadonlyMap<string, string>>(new Map());
  protected documentationHtml: SafeHtml | null = null;
  protected documentationLoaded = false;
  protected exampleType: 'quote' | 'policy' = 'quote';
  protected exampleRequest = '';
  protected exampleResponse = '';

  ngOnInit(): void {
    this.api.insuranceCompanies().subscribe({ next: (items) => { this.companies = items ?? []; }, error: () => { this.companies = []; } });
    this.api.policyForms().subscribe({ next: (items) => { this.forms = items ?? []; }, error: () => { this.forms = []; } });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const versionNo = Number(this.route.snapshot.paramMap.get('versionNo'));
    this.api.product(id, versionNo).subscribe({
      next: (product) => {
        this.product = normalizeProduct(product);
        this.loadCoverNames(this.product.lob);
      },
      error: (error: unknown) => this.fail(error, 'Продукт не найден'),
    });
  }

  protected get locked(): boolean {
    return this.product.versionStatus === 'PROD';
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected save(): void {
    if (this.locked || this.product.id == null) {
      return;
    }
    if (!this.product.code || !this.product.name || !this.product.lob) {
      this.snack.open('Заполните линию, код и название', 'Закрыть', { duration: 2500 });
      return;
    }
    this.saving.set(true);
    this.api.updateProduct(this.product.id, this.product.versionNo, this.product).subscribe({
      next: (saved) => {
        this.product = normalizeProduct(saved);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.fail(error, 'Не удалось сохранить продукт');
      },
    });
  }

  protected publish(): void {
    if (this.product.id == null || this.dirty()) {
      this.snack.open('Сначала сохраните изменения', 'Закрыть', { duration: 2500 });
      return;
    }
    this.api.publishProduct(this.product.id, this.product.versionNo).subscribe({
      next: (saved) => this.openVersion(saved),
      error: (error: unknown) => this.fail(error, 'Не удалось вывести в прод'),
    });
  }

  protected newVersion(): void {
    if (this.product.id == null) {
      return;
    }
    this.api.createProductVersion(this.product.id, this.product.versionNo).subscribe({
      next: (saved) => this.openVersion(saved),
      error: (error: unknown) => this.fail(error, 'Не удалось создать версию'),
    });
  }

  protected deleteVersion(): void {
    if (this.product.id == null || !confirm('Удалить эту версию?')) {
      return;
    }
    this.api.deleteProductVersion(this.product.id, this.product.versionNo).subscribe({
      next: () => void this.router.navigate(['/products']),
      error: (error: unknown) => this.fail(error, 'Не удалось удалить версию'),
    });
  }

  protected exportFile(): void {
    downloadJson(`product_${this.product.code || 'new'}.json`, this.product);
  }

  protected async importFile(): Promise<void> {
    const payload = await pickJsonFile();
    if (!payload || typeof payload !== 'object') {
      if (payload === undefined) {
        this.snack.open('Файл содержит некорректный JSON', 'Закрыть', { duration: 3000 });
      }
      return;
    }
    const imported = normalizeProduct(payload as ProductVersion);
    imported.id = this.product.id;
    imported.versionNo = this.product.versionNo;
    imported.versionStatus = this.product.versionStatus;
    this.product = imported;
    this.touch();
  }

  protected packageOpen(code: string): boolean {
    return this.openPackages().has(code);
  }

  protected togglePackage(code: string): void {
    const next = new Set(this.openPackages());
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.openPackages.set(next);
  }

  protected coverTitle(cover: ProductCover): string {
    return this.coverNames().get(cover.code)?.trim() || cover.code || 'Покрытие';
  }

  protected addPackage(): void {
    this.editPackage(null);
  }

  protected askPackages(): void {
    const text = this.packagePrompt.trim();
    if (!text || this.asking() || this.locked) {
      return;
    }
    if (this.product.id == null) {
      this.snack.open('Сначала сохраните продукт', 'Закрыть', { duration: 3000 });
      return;
    }
    this.asking.set(true);
    this.api.assistProduct(this.product.id, this.product.versionNo, text, 'PACKAGE').subscribe({
      next: (response) => {
        this.asking.set(false);
        if (response.success === false) {
          this.snack.open(response.errors?.filter(Boolean).join('; ') || 'LLM не вернул пакеты', 'Закрыть', { duration: 4000 });
          return;
        }
        const summary = this.applyPackageDrafts(this.packageDrafts(response.result));
        const message = summary.packagesAdded || summary.coversAdded
          ? `Пакеты: +${summary.packagesAdded}, покрытия: +${summary.coversAdded}`
          : 'Новых пакетов и покрытий нет';
        this.snack.open(response.warnings?.filter(Boolean).join('; ') || message, 'Закрыть', { duration: 3500 });
      },
      error: (error: unknown) => {
        this.asking.set(false);
        this.snack.open(bffErrorMessage(error, 'LLM не ответил'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected editPackage(item: ProductPackage | null): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: { title: 'Пакет', fields: [{ key: 'code', label: 'Код' }, { key: 'name', label: 'Название' }], value: item ? { ...item } : {} },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const next = { code: String(result['code'] ?? '').trim(), name: String(result['name'] ?? ''), covers: item?.covers ?? [], files: item?.files ?? [] };
      if (!next.code) {
        return;
      }
      if (!item) {
        this.product.packages = [...this.product.packages, next];
        this.togglePackage(next.code);
      } else {
        Object.assign(item, next);
      }
      this.touch();
    });
  }

  protected deletePackage(item: ProductPackage): void {
    this.product.packages = this.product.packages.filter((row) => row !== item);
    const next = new Set(this.openPackages());
    next.delete(item.code);
    this.openPackages.set(next);
    this.touch();
  }

  protected openCalculator(item: ProductPackage): void {
    if (this.product.id == null) {
      return;
    }
    void this.router.navigate(['/products', this.product.id, 'versions', this.product.versionNo, 'packages', item.code, 'calculator']);
  }

  protected addCover(pkg: ProductPackage): void {
    this.editCover(pkg, null);
  }

  protected editCover(pkg: ProductPackage, item: ProductCover | null): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '520px',
      data: {
        title: 'Покрытие',
        fields: [
          { key: 'code', label: 'Код' },
          { key: 'waitingPeriod', label: 'Период ожидания' },
          { key: 'coverageTerm', label: 'Срок покрытия' },
          { key: 'isMandatory', label: 'Обязательное', kind: 'checkbox' },
          { key: 'isDeductibleMandatory', label: 'Франшиза обязательна', kind: 'checkbox' },
        ],
        value: item ? { ...item } : { isMandatory: false, isDeductibleMandatory: false },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const next: ProductCover = {
        code: String(result['code'] ?? '').trim(),
        waitingPeriod: String(result['waitingPeriod'] ?? ''),
        coverageTerm: String(result['coverageTerm'] ?? ''),
        isMandatory: !!result['isMandatory'],
        isDeductibleMandatory: !!result['isDeductibleMandatory'],
        deductibles: item?.deductibles ?? [],
        limits: item?.limits ?? [],
      };
      if (!next.code) {
        return;
      }
      if (!item) {
        pkg.covers = [...pkg.covers, next];
      } else {
        Object.assign(item, next);
      }
      this.touch();
    });
  }

  protected deleteCover(pkg: ProductPackage, item: ProductCover): void {
    pkg.covers = pkg.covers.filter((row) => row !== item);
    this.touch();
  }

  protected addDeductible(cover: ProductCover): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: { title: 'Франшиза', fields: [{ key: 'text', label: 'Текст', kind: 'textarea' }], value: {} },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      cover.deductibles = [...cover.deductibles, { text: String(result['text'] ?? '') }];
      this.touch();
    });
  }

  protected editDeductible(cover: ProductCover, index: number): void {
    const current = cover.deductibles[index];
    if (!current) {
      return;
    }
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: { title: 'Франшиза', fields: [{ key: 'text', label: 'Текст', kind: 'textarea' }], value: { ...current } },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      cover.deductibles = cover.deductibles.map((item, itemIndex) => itemIndex === index
        ? { ...current, text: String(result['text'] ?? '') }
        : item);
      this.touch();
    });
  }

  protected deleteDeductible(cover: ProductCover, index: number): void {
    cover.deductibles = cover.deductibles.filter((_, item) => item !== index);
    this.touch();
  }

  protected addFile(pkg: ProductPackage): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: {
        title: 'Файл пакета',
        fields: [
          { key: 'fileCode', label: 'Тип' },
          { key: 'fileNr', label: 'Номер', kind: 'number' },
          { key: 'fileName', label: 'Файл' },
          { key: 'isStatic', label: 'Статический', kind: 'checkbox' },
        ],
        value: { fileNr: 1 },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const file: PackageFile = {
        fileCode: String(result['fileCode'] ?? ''),
        fileName: String(result['fileName'] ?? ''),
        fileNr: Number(result['fileNr'] ?? 1) || 1,
        isStatic: !!result['isStatic'],
      };
      pkg.files = [...pkg.files, file];
      this.touch();
    });
  }

  protected deleteFile(pkg: ProductPackage, file: PackageFile): void {
    pkg.files = pkg.files.filter((item) => item !== file);
    this.touch();
  }

  private packageDrafts(result: unknown): Array<{ code?: string; name?: string; covers?: unknown[] }> {
    if (Array.isArray(result)) {
      return result.filter((item): item is { code?: string; name?: string; covers?: unknown[] } => !!item && typeof item === 'object');
    }
    if (!result || typeof result !== 'object') {
      return [];
    }
    const body = result as { packages?: unknown[]; code?: string; name?: string };
    if (Array.isArray(body.packages)) {
      return body.packages.filter((item): item is { code?: string; name?: string; covers?: unknown[] } => !!item && typeof item === 'object');
    }
    return body.code && body.name ? [body] : [];
  }

  private applyPackageDrafts(drafts: Array<{ code?: string; name?: string; covers?: unknown[] }>): { packagesAdded: number; coversAdded: number } {
    let packagesAdded = 0;
    let coversAdded = 0;
    const packages = [...this.product.packages];
    for (const draft of drafts) {
      const code = String(draft.code ?? '').trim();
      const name = String(draft.name ?? '').trim();
      if (!code || !name) {
        continue;
      }
      const covers = (draft.covers ?? []).flatMap((item) => {
        const cover = this.coverFromDraft(item);
        return cover ? [cover] : [];
      });
      const index = packages.findIndex((item) => item.code.trim().toUpperCase() === code.toUpperCase());
      if (index < 0) {
        packages.push({ code, name, covers, files: [] });
        packagesAdded += 1;
        coversAdded += covers.length;
        this.togglePackage(code);
        continue;
      }
      const existing = packages[index];
      const known = new Set(existing.covers.map((item) => item.code.trim().toUpperCase()));
      const added = covers.filter((item) => !known.has(item.code.trim().toUpperCase()));
      if (!added.length) {
        continue;
      }
      packages[index] = { ...existing, covers: [...existing.covers, ...added] };
      coversAdded += added.length;
    }
    if (packagesAdded || coversAdded) {
      this.product.packages = packages;
      this.touch();
    }
    return { packagesAdded, coversAdded };
  }

  private coverFromDraft(value: unknown): ProductCover | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const draft = value as { code?: string; isMandatory?: boolean; waitingPeriod?: string; coverageTerm?: string; isDeductibleMandatory?: boolean; deductibles?: Array<{ id?: number; text?: string }> };
    const code = String(draft.code ?? '').trim();
    if (!code) {
      return null;
    }
    return {
      code,
      isMandatory: !!draft.isMandatory,
      waitingPeriod: draft.waitingPeriod ?? '',
      coverageTerm: draft.coverageTerm ?? '',
      isDeductibleMandatory: !!draft.isDeductibleMandatory,
      deductibles: (draft.deductibles ?? [])
        .filter((item) => item && String(item.text ?? '').trim())
        .map((item) => ({ id: item.id, text: String(item.text).trim() })),
      limits: [],
    };
  }

  private loadCoverNames(lob: string): void {
    if (!lob) {
      this.coverNames.set(new Map());
      return;
    }
    this.api.lob(lob).subscribe({
      next: (line) => {
        const names = new Map<string, string>();
        for (const cover of line.mpCovers ?? []) {
          if (cover.coverCode) {
            names.set(cover.coverCode, cover.coverName);
          }
        }
        this.coverNames.set(names);
      },
      error: () => this.coverNames.set(new Map()),
    });
  }

  protected readonly waitingTypes = ['RANGE', 'LIST', 'NEXT_MONTH'];
  protected readonly termTypes = ['RANGE', 'LIST'];
  protected readonly resetPolicies = ['YEARLY', 'MONTHLY'];
  protected readonly celGroups = [
    { ruleType: 'PRE_QUOTE_VALIDATION', title: 'PRE QUOTE' },
    { ruleType: 'POST_QUOTE_VALIDATION', title: 'POST QUOTE' },
    { ruleType: 'PRE_SAVE_VALIDATION', title: 'PRE SAVE' },
    { ruleType: 'UNDERWRITING', title: 'UNDERWRITING' },
  ];

  protected validatorTypeLabel(code: string): string {
    return ({
      RANGE: 'Допустимый диапазон',
      LIST: 'Список возможных значений',
      NEXT_MONTH: '1 число следующего месяца',
    } as Record<string, string>)[code] ?? code;
  }

  protected waitingHelp(code: string | undefined): string {
    if (code === 'LIST') {
      return 'Список возможных значений через запятую. Формат ISO 8601, например P14D — 14 дней, P2M — 2 месяца, P1Y — 1 год.';
    }
    if (code === 'RANGE') {
      return 'Минимальное и максимальное количество дней между датой выпуска договора и датой начала действия. Формат ISO 8601, например P5D-P365D.';
    }
    if (code === 'NEXT_MONTH') {
      return 'Договор начнет действовать с 1 числа следующего месяца.';
    }
    return '';
  }

  protected termHelp(code: string | undefined): string {
    if (code === 'LIST') {
      return 'Список возможных значений через запятую. Формат ISO 8601, например P14D — 14 дней, P2M — 2 месяца, P1Y — 1 год.';
    }
    if (code === 'RANGE') {
      return 'Минимальный и максимальный срок действия договора. Пример: P5D–P365D — договор может действовать от 5 до 365 дней.';
    }
    return '';
  }

  protected celRules(ruleType: string): ProductCelRule[] {
    return (this.product.celRules ?? [])
      .filter((rule) => rule.ruleType === ruleType)
      .sort((left, right) => (left.priority ?? 100) - (right.priority ?? 100));
  }

  protected addCelRule(ruleType: string): void {
    this.openCelRule({ ruleType, priority: 100, code: '', name: '', llmText: '', message: '' }, (rule) => {
      this.product.celRules = [...(this.product.celRules ?? []), rule];
      this.touch();
    });
  }

  protected editCelRule(rule: ProductCelRule): void {
    this.openCelRule(rule, (updated) => {
      this.product.celRules = (this.product.celRules ?? []).map((item) => item === rule ? { ...item, ...updated } : item);
      this.touch();
    });
  }

  protected deleteCelRule(rule: ProductCelRule): void {
    this.product.celRules = (this.product.celRules ?? []).filter((item) => item !== rule);
    this.touch();
  }

  private openCelRule(rule: ProductCelRule, apply: (rule: ProductCelRule) => void): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '640px',
      data: {
        title: rule.code ? 'Редактировать правило' : 'Добавить правило',
        fields: [
          { key: 'code', label: 'Код' },
          { key: 'name', label: 'Название' },
          { key: 'priority', label: 'Приоритет', kind: 'number' },
          { key: 'llmText', label: 'Текст правила', kind: 'textarea' },
          { key: 'message', label: 'Текст ошибки', kind: 'textarea' },
        ],
        value: { ...rule },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      apply({
        ...rule,
        code: String(result['code'] ?? ''),
        name: String(result['name'] ?? ''),
        priority: Number(result['priority'] ?? 100),
        llmText: String(result['llmText'] ?? ''),
        message: String(result['message'] ?? ''),
      });
    });
  }

  protected addValidator(kind: 'quote' | 'save'): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '520px',
      data: {
        title: kind === 'quote' ? 'Проверка котировки' : 'Проверка сохранения',
        fields: [
          { key: 'keyLeft', label: 'Левый ключ' },
          { key: 'ruleType', label: 'Правило' },
          { key: 'valueRight', label: 'Значение' },
          { key: 'dataType', label: 'Тип данных' },
          { key: 'errorText', label: 'Текст ошибки' },
        ],
        value: { ruleType: 'NOT_NULL', dataType: 'STRING' },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const list = kind === 'quote' ? this.product.quoteValidator : this.product.saveValidator;
      const row: QuoteValidator = {
        lineNr: list.length + 1,
        keyLeft: String(result['keyLeft'] ?? ''),
        ruleType: String(result['ruleType'] ?? ''),
        valueRight: String(result['valueRight'] ?? ''),
        dataType: String(result['dataType'] ?? ''),
        errorText: String(result['errorText'] ?? ''),
        validatorType: kind === 'quote' ? 'QUOTE' : 'SAVE',
      };
      if (kind === 'quote') {
        this.product.quoteValidator = [...list, row];
      } else {
        this.product.saveValidator = [...list, row];
      }
      this.touch();
    });
  }

  protected deleteValidator(kind: 'quote' | 'save', index: number): void {
    if (kind === 'quote') {
      this.product.quoteValidator = this.product.quoteValidator.filter((_, item) => item !== index);
    } else {
      this.product.saveValidator = this.product.saveValidator.filter((_, item) => item !== index);
    }
    this.touch();
  }

  protected editSchemaVar(variable: PolicyVar): void {
    if (!this.canMutateSchema()) {
      return;
    }
    this.dialog.open(SchemaVarDialogComponent, {
      width: '560px',
      data: { variable: { ...variable } },
    }).afterClosed().subscribe((result?: PolicyVar) => {
      if (!result || this.product.id == null) {
        return;
      }
      this.api.updateProductVar(this.product.id, this.product.versionNo, variable.varCode, result).subscribe({
        next: (saved) => this.applySchema(saved, 'Переменная обновлена'),
        error: (error: unknown) => this.fail(error, 'Не удалось обновить переменную'),
      });
    });
  }

  protected toggleSchemaFlag(event: { variable: PolicyVar; field: 'isOptional' | 'isTarifFactor' }): void {
    if (!this.canMutateSchema() || this.product.id == null) {
      return;
    }
    const next = { ...event.variable, [event.field]: !event.variable[event.field] };
    this.api.updateProductVar(this.product.id, this.product.versionNo, event.variable.varCode, next).subscribe({
      next: (saved) => this.applySchema(saved),
      error: (error: unknown) => this.fail(error, 'Не удалось обновить переменную'),
    });
  }

  protected deleteSchemaVar(variable: PolicyVar): void {
    if (!this.canMutateSchema() || this.product.id == null) {
      return;
    }
    this.api.deleteProductVar(this.product.id, this.product.versionNo, variable.varCode).subscribe({
      next: (saved) => this.applySchema(saved, 'Переменная скрыта'),
      error: (error: unknown) => this.fail(error, 'Не удалось удалить переменную'),
    });
  }

  protected restoreSchemaVar(variable: PolicyVar): void {
    if (!this.canMutateSchema() || this.product.id == null) {
      return;
    }
    this.api.updateProductVar(this.product.id, this.product.versionNo, variable.varCode, { ...variable, isDeleted: false }).subscribe({
      next: (saved) => this.applySchema(saved, 'Переменная возвращена'),
      error: (error: unknown) => this.fail(error, 'Не удалось вернуть переменную'),
    });
  }

  private canMutateSchema(): boolean {
    if (this.locked) {
      return false;
    }
    if (this.dirty()) {
      this.snack.open('Сначала сохраните изменения продукта', 'Закрыть', { duration: 2500 });
      return false;
    }
    return this.product.id != null;
  }

  private applySchema(saved: ProductVersion, message?: string): void {
    this.product = normalizeProduct(saved);
    this.dirty.set(false);
    if (message) {
      this.snack.open(message, 'Закрыть', { duration: 2000 });
    }
  }

  protected loadDocs(): void {
    if (this.product.id == null) {
      return;
    }
    this.api.documentation(this.product.id, this.product.versionNo).subscribe({
      next: (doc) => {
        const markdown = doc.markdown ?? '';
        const html = marked.parse(markdown, { async: false }) as string;
        this.documentationLoaded = true;
        this.documentationHtml = markdown.trim() ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
      },
      error: (error: unknown) => this.fail(error, 'Документация недоступна'),
    });
  }

  protected loadExample(): void {
    if (this.product.id == null) {
      return;
    }
    this.api.testRequest(this.product.id, this.product.versionNo, this.exampleType).subscribe({
      next: (text) => { this.exampleRequest = prettyJson(text); },
      error: (error: unknown) => this.fail(error, 'Пример недоступен'),
    });
  }

  protected executeExample(): void {
    const body = this.parseExample();
    if (!body) {
      return;
    }
    this.api.executeTestRequest(this.exampleType, body).subscribe({
      next: (text) => { this.exampleResponse = prettyJson(text); },
      error: (error: unknown) => { this.exampleResponse = exampleErrorText(error); },
    });
  }

  protected saveExample(): void {
    if (this.product.id == null) {
      return;
    }
    const body = this.parseExample();
    if (!body) {
      return;
    }
    this.api.saveTestRequest(this.product.id, this.product.versionNo, this.exampleType, body).subscribe({
      next: () => this.snack.open('Сохранено', 'Закрыть', { duration: 2000 }),
      error: (error: unknown) => this.fail(error, 'Не удалось сохранить пример'),
    });
  }

  private parseExample(): unknown | null {
    const json = this.exampleRequest.trim();
    if (!json) {
      this.snack.open('Запрос пуст', 'Закрыть', { duration: 2500 });
      return null;
    }
    try {
      return JSON.parse(json) as unknown;
    } catch {
      this.snack.open('Запрос не является JSON', 'Закрыть', { duration: 2500 });
      return null;
    }
  }

  private openVersion(saved: ProductVersion): void {
    this.snack.open('Версия обновлена', 'Закрыть', { duration: 2000 });
    if (saved.id != null) {
      void this.router.navigate(['/products', saved.id, 'versions', saved.versionNo]);
      this.product = normalizeProduct(saved);
      this.dirty.set(false);
    }
  }

  private fail(error: unknown, fallback: string): void {
    this.snack.open(bffErrorMessage(error, fallback), 'Закрыть', { duration: 3500 });
  }
}

function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function exampleErrorText(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return prettyJson(error.error);
    }
    if (error.error && typeof error.error === 'object') {
      return JSON.stringify(error.error, null, 2);
    }
  }
  return bffErrorMessage(error, 'Запрос не выполнен');
}
