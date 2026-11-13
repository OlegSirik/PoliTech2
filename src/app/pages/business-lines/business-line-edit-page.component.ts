import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import {
  CalculatorTemplate,
  LobCover,
  LobDocument,
  LobFile,
  LobVar,
  PolicyVar,
  emptyLob,
  normalizeLob,
} from '../../core/api/catalog.models';
import { downloadJson, pickJsonFile } from '../../core/api/json-file';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { FieldsDialogComponent } from '../../shared/ui/fields-dialog/fields-dialog.component';
import { SchemaTreeComponent } from '../products/schema-tree.component';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { TariffTablesComponent } from '../../shared/ui/tariff-tables/tariff-tables.component';
import { TariffTable } from '../../shared/ui/tariff-tables/tariff-table.model';
import { RuleAssistService } from '../../core/api/rule-assist.service';

@Component({
  selector: 'pt-business-line-edit-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderComponent,
    SchemaTreeComponent,
    ActionButtonComponent,
    TariffTablesComponent,
  ],
  templateUrl: './business-line-edit-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class BusinessLineEditPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly assist = inject(RuleAssistService);

  protected readonly isNew = signal(true);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly asking = signal(false);
  protected readonly agentOpen = signal(false);
  protected readonly llmReady = signal(true);
  protected line: LobDocument = emptyLob();
  protected coverPrompt = '';
  protected templates: CalculatorTemplate[] = [];

  ngOnInit(): void {
    this.assist.llmConfig().subscribe({
      next: (view) => this.llmReady.set(!!view.configured && !!view.enabled),
      error: () => this.llmReady.set(false),
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      return;
    }
    this.isNew.set(false);
    this.api.lob(id).subscribe({
      next: (line) => {
        this.line = normalizeLob(line);
        this.loadTemplates();
      },
      error: (error: unknown) => this.fail(error, 'Линия бизнеса не найдена'),
    });
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected schemaTreeVars(): LobVar[] {
    return this.line.mpVars.filter((item) => this.isSchemaTreeVar(item));
  }

  protected textVars(): LobVar[] {
    return this.line.mpVars.filter((item) => item.varType === 'TEXT');
  }

  protected save(): void {
    if (!this.line.mpCode.trim() || !this.line.mpName.trim()) {
      this.snack.open('Укажите код и название', 'Закрыть', { duration: 2500 });
      return;
    }
    this.saving.set(true);
    const request = this.isNew() || !this.line.id
      ? this.api.createLob(this.line)
      : this.api.updateLob(this.line.id, this.line);
    request.subscribe({
      next: (saved) => {
        this.line = normalizeLob(saved);
        this.isNew.set(false);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
        this.loadTemplates();
        if (saved.id) {
          void this.router.navigate(['/business-lines', saved.id], { replaceUrl: true });
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.fail(error, 'Не удалось сохранить линию');
      },
    });
  }

  protected exportFile(): void {
    downloadJson(`lob_${this.line.mpCode || 'new'}.json`, this.line);
  }

  protected async importFile(): Promise<void> {
    const payload = await pickJsonFile();
    if (payload === undefined) {
      this.snack.open('Файл содержит некорректный JSON', 'Закрыть', { duration: 3000 });
      return;
    }
    if (!payload || typeof payload !== 'object') {
      return;
    }
    const imported = normalizeLob(payload as LobDocument);
    imported.id = this.line.id;
    this.line = imported;
    this.touch();
  }

  protected addVar(text: boolean): void {
    const fields = text
      ? [
          { key: 'varCode', label: 'Код' },
          { key: 'varName', label: 'Название' },
          { key: 'varValue', label: 'Значение', kind: 'textarea' as const },
        ]
      : [
          { key: 'varCode', label: 'Код' },
          { key: 'varName', label: 'Название' },
          { key: 'varPath', label: 'Путь' },
          { key: 'varType', label: 'Тип' },
          { key: 'varDataType', label: 'Тип данных' },
          { key: 'varValue', label: 'Значение' },
        ];
    this.dialog.open(FieldsDialogComponent, {
      width: '520px',
      data: { title: text ? 'Строка' : 'Поле схемы', fields, value: text ? {} : { varType: 'IN', varDataType: 'STRING' } },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const variable: LobVar = {
        varCode: String(result['varCode'] ?? '').trim(),
        varName: String(result['varName'] ?? ''),
        varPath: String(result['varPath'] ?? ''),
        varType: text ? 'TEXT' : String(result['varType'] ?? 'IN'),
        varDataType: text ? 'STRING' : String(result['varDataType'] ?? 'STRING'),
        varValue: String(result['varValue'] ?? ''),
        varNr: this.line.mpVars.length + (text ? 1000 : 1),
      };
      if (!variable.varCode) {
        return;
      }
      this.line.mpVars = [...this.line.mpVars, variable];
      this.touch();
    });
  }

  protected editVar(variable: PolicyVar): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '520px',
      data: {
        title: variable.varCode,
        fields: [
          { key: 'varName', label: 'Название' },
          { key: 'varPath', label: 'Путь' },
          { key: 'varType', label: 'Тип' },
          { key: 'varDataType', label: 'Тип данных' },
          { key: 'varValue', label: 'Значение', kind: 'textarea' },
        ],
        value: { ...variable },
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      Object.assign(variable, {
        varName: result['varName'],
        varPath: result['varPath'],
        varType: result['varType'],
        varDataType: result['varDataType'],
        varValue: result['varValue'],
      });
      this.touch();
    });
  }

  protected deleteVar(variable: LobVar): void {
    this.line.mpVars = this.line.mpVars.filter((item) => item !== variable);
    this.touch();
  }

  protected hideSchemaVar(variable: PolicyVar): void {
    const target = this.line.mpVars.find((item) => item === (variable as LobVar));
    if (!target) {
      return;
    }
    this.markSchemaBranch(target, true);
    this.line.mpVars = [...this.line.mpVars];
    this.touch();
    this.snack.open(`Скрыто из дерева: ${target.varName} (${target.varCode})`, 'Закрыть', { duration: 2500 });
  }

  protected restoreSchemaVar(variable: PolicyVar): void {
    const seen = new Set<LobVar>();
    let current = this.line.mpVars.find((item) => item === (variable as LobVar));
    while (current && !seen.has(current)) {
      seen.add(current);
      current.isDeleted = false;
      current = this.parentOf(current);
    }
    this.line.mpVars = [...this.line.mpVars];
    this.touch();
  }

  private isSchemaTreeVar(variable: LobVar): boolean {
    const seen = new Set<LobVar>();
    let current: LobVar | undefined = variable;
    while (current && !seen.has(current)) {
      if ((current.varType ?? '').trim().toUpperCase() === 'OBJECT') {
        return true;
      }
      seen.add(current);
      current = this.parentOf(current);
    }
    return false;
  }

  private parentOf(variable: LobVar): LobVar | undefined {
    if (variable.parent_id == null) {
      return undefined;
    }
    const parentId = Number(variable.parent_id);
    return this.line.mpVars.find((item) => item.id != null && Number(item.id) === parentId);
  }

  private markSchemaBranch(variable: LobVar, deleted: boolean): void {
    variable.isDeleted = deleted;
    if (variable.id == null) {
      return;
    }
    const id = Number(variable.id);
    for (const child of this.line.mpVars) {
      if (child.parent_id != null && Number(child.parent_id) === id && this.isSchemaTreeVar(child)) {
        this.markSchemaBranch(child, deleted);
      }
    }
  }

  protected addCover(): void {
    this.editCover(null);
  }

  protected editCover(cover: LobCover | null): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '520px',
      data: {
        title: cover ? cover.coverCode : 'Покрытие',
        fields: [
          { key: 'coverCode', label: 'Код' },
          { key: 'coverName', label: 'Название' },
          { key: 'risks', label: 'Риски', kind: 'textarea' },
        ],
        value: cover ? { ...cover } : {},
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const next: LobCover = {
        coverCode: String(result['coverCode'] ?? '').trim(),
        coverName: String(result['coverName'] ?? ''),
        risks: String(result['risks'] ?? ''),
      };
      if (!next.coverCode) {
        return;
      }
      if (!cover) {
        this.line.mpCovers = [...this.line.mpCovers, next];
      } else {
        Object.assign(cover, next);
      }
      this.touch();
    });
  }

  protected deleteCover(cover: LobCover): void {
    this.line.mpCovers = this.line.mpCovers.filter((item) => item !== cover);
    this.touch();
  }

  protected askCovers(): void {
    const text = this.coverPrompt.trim();
    if (!text || !this.line.mpCode) {
      this.snack.open('Укажите код линии и описание покрытий', 'Закрыть', { duration: 2500 });
      return;
    }
    this.asking.set(true);
    this.api.assistLob(this.line.mpCode, text, 'COVER').subscribe({
      next: (response) => {
        this.asking.set(false);
        if (response.success === false) {
          const message = response.errors?.filter(Boolean).join('; ') || 'LLM не вернул покрытия';
          this.snack.open(message, 'Закрыть', { duration: 4000 });
          return;
        }
        const drafts = this.coverDrafts(response.result);
        const known = new Set(this.line.mpCovers.map((item) => item.coverCode.toUpperCase()));
        const added = drafts.filter((item) => item.coverCode && !known.has(item.coverCode.toUpperCase()));
        this.line.mpCovers = [...this.line.mpCovers, ...added];
        if (added.length) {
          this.touch();
        }
        const message = added.length ? `Добавлено покрытий: ${added.length}` : 'Новых покрытий нет';
        this.snack.open(response.warnings?.filter(Boolean).join('; ') || message, 'Закрыть', { duration: 3000 });
      },
      error: (error: unknown) => {
        this.asking.set(false);
        this.fail(error, 'LLM не ответил');
      },
    });
  }

  protected addFile(): void {
    this.editFile(null);
  }

  protected editFile(file: LobFile | null): void {
    this.dialog.open(FieldsDialogComponent, {
      width: '480px',
      data: {
        title: 'Файл',
        fields: [
          { key: 'fileCode', label: 'Код' },
          { key: 'fileName', label: 'Название' },
        ],
        value: file ? { ...file } : {},
      },
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const next = { fileCode: String(result['fileCode'] ?? ''), fileName: String(result['fileName'] ?? '') };
      if (!file) {
        this.line.mpFiles = [...this.line.mpFiles, next];
      } else {
        Object.assign(file, next);
      }
      this.touch();
    });
  }

  protected deleteFile(file: LobFile): void {
    this.line.mpFiles = this.line.mpFiles.filter((item) => item !== file);
    this.touch();
  }

  protected onTariffTables(tables: TariffTable[]): void {
    this.line.mpCoefficients = tables as typeof this.line.mpCoefficients;
    this.touch();
  }

  protected renameTemplate(template: CalculatorTemplate): void {
    const name = prompt('Название шаблона', template.calculatorName ?? '');
    if (!name || template.calculatorId == null) {
      return;
    }
    this.api.renameTemplate(template.calculatorId, name).subscribe({
      next: () => this.loadTemplates(),
      error: (error: unknown) => this.fail(error, 'Не удалось переименовать шаблон'),
    });
  }

  protected deleteTemplate(template: CalculatorTemplate): void {
    if (template.calculatorId == null || !confirm('Удалить шаблон?')) {
      return;
    }
    this.api.deleteTemplate(template.calculatorId).subscribe({
      next: () => this.loadTemplates(),
      error: (error: unknown) => this.fail(error, 'Не удалось удалить шаблон'),
    });
  }

  protected back(): void {
    void this.router.navigate(['/business-lines']);
  }

  private loadTemplates(): void {
    if (!this.line.mpCode) {
      this.templates = [];
      return;
    }
    this.api.templates(this.line.mpCode).subscribe({
      next: (items) => {
        this.templates = items ?? [];
      },
      error: () => {
        this.templates = [];
      },
    });
  }

  private coverDrafts(result: unknown): LobCover[] {
    const list = Array.isArray(result)
      ? result
      : result && typeof result === 'object' && Array.isArray((result as { covers?: unknown[] }).covers)
        ? (result as { covers: unknown[] }).covers
        : result ? [result] : [];
    return list.map((item) => {
      const row = item as { code?: string; coverCode?: string; name?: string; coverName?: string; risks?: string };
      return {
        coverCode: (row.coverCode || row.code || '').trim(),
        coverName: (row.coverName || row.name || '').trim(),
        risks: row.risks || '',
      };
    }).filter((item) => item.coverCode && item.coverName);
  }

  private fail(error: unknown, fallback: string): void {
    this.snack.open(bffErrorMessage(error, fallback), 'Закрыть', { duration: 3500 });
  }
}
