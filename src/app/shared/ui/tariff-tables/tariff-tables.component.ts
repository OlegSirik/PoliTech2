import { Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CoefficientDataRow } from '../../../core/api/catalog.models';
import { ActionButtonComponent } from '../action-button/action-button.component';
import { exportCoefficientExcel, pickCoefficientExcel } from './coefficient-excel';
import { buildCoefficientDataSql } from './coefficient-sql';
import { SqlDialogComponent } from './sql-dialog.component';
import { TariffColumnDialogComponent } from './tariff-column-dialog.component';
import { TariffColumn, TariffTable, TariffVarOption } from './tariff-table.model';
import { TariffTableDialogComponent } from './tariff-table-dialog.component';

@Component({
  selector: 'pt-tariff-tables',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, MatTooltipModule, ActionButtonComponent],
  template: `
    <section class="stack">
      <section class="panel pt-panel">
        <div class="toolbar">
          <h2 class="section-title">{{ title() }}</h2>
          <button mat-stroked-button class="pt-btn-agent" type="button" matTooltip="AI-агент" aria-label="AI-агент" [class.is-open]="agentOpen()" (click)="agentToggle.emit()">
            <mat-icon>smart_toy</mat-icon>
          </button>
          <button mat-flat-button class="pt-btn-accent" type="button" (click)="addTable()"><mat-icon>add</mat-icon>Добавить</button>
        </div>
      </section>
      @for (item of tables(); track $index) {
        <article class="panel pt-panel">
          <header class="fold__head" (click)="toggle(item)">
            <button mat-icon-button type="button" [attr.aria-label]="open(item) ? 'Свернуть' : 'Развернуть'" (click)="$event.stopPropagation(); toggle(item)">
              <mat-icon>{{ open(item) ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <span class="fold__name">{{ item.varName || 'Без названия' }}</span>
            <span class="fold__code">{{ item.varCode }}</span>
            <span class="fold__actions" (click)="$event.stopPropagation()">
              <pt-action-button kind="edit" (pressed)="editTable(item)" />
              <pt-action-button kind="delete" (pressed)="deleteTable(item)" />
            </span>
          </header>
          @if (open(item)) {
            <div class="fold__body">
              <div class="toolbar toolbar-end">
                <button mat-flat-button class="pt-btn-accent" type="button" (click)="addColumn(item)"><mat-icon>add</mat-icon>Добавить</button>
                <button mat-stroked-button type="button" (click)="showSql(item)">SQL</button>
              </div>
              <table>
                <thead><tr><th>№</th><th>Код</th><th>Тип</th><th>Оператор</th><th>Сортировка</th><th></th></tr></thead>
                <tbody>
                  @for (column of item.columns; track $index) {
                    <tr (click)="editColumn(item, column)">
                      <td>{{ column.nr }}</td>
                      <td>{{ column.varCode }}</td>
                      <td>{{ column.varDataType }}</td>
                      <td>{{ column.conditionOperator }}</td>
                      <td>{{ column.sortOrder }}</td>
                      <td class="row-actions">
                        <pt-action-button kind="edit" (pressed)="editColumn(item, column)" />
                        <pt-action-button kind="delete" (pressed)="deleteColumn(item, column)" />
                      </td>
                    </tr>
                  } @empty { <tr><td colspan="6" class="state">Колонок нет</td></tr> }
                </tbody>
              </table>
              @if (showsGrid(item)) {
                <div class="grid">
                  <div class="toolbar">
                    <h2 class="section-title">Тарифная сетка по {{ item.varName || item.varCode }}</h2>
                    <button mat-flat-button color="primary" type="button" (click)="saveGrid.emit()">Сохранить данные</button>
                    <button mat-stroked-button type="button" (click)="exportExcel(item)">
                      <mat-icon>file_download</mat-icon>
                      В Excel
                    </button>
                    <button mat-stroked-button type="button" (click)="importExcel(item)">
                      <mat-icon>file_upload</mat-icon>
                      Из Excel
                    </button>
                  </div>
                  <table class="data">
                    <thead>
                      <tr>
                        @for (column of dataColumns(item); track column.nr + column.varCode) {
                          <th>{{ dataHeader(column) }}</th>
                        }
                        <th class="num">Коэффициент</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of gridRows(); track $index) {
                        <tr>
                          @for (column of dataColumns(item); track column.nr + column.varCode; let index = $index) {
                            <td>{{ dataCell(row, index) }}</td>
                          }
                          <td class="num">{{ row.resultValue }}</td>
                        </tr>
                      } @empty {
                        <tr><td class="state" [attr.colspan]="dataColumns(item).length + 1">Строк данных нет</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </article>
      } @empty { <p class="state">Таблиц нет</p> }
    </section>
  `,
  styles: `
    .stack { display: grid; gap: var(--pt-space-3); }
    .toolbar { display: flex; flex-wrap: wrap; gap: var(--pt-space-2); align-items: center; }
    .toolbar-end { justify-content: flex-end; }
    .section-title {
      margin: 0 auto 0 0;
      font-size: var(--pt-font-xl);
      font-weight: var(--pt-weight-semibold);
      letter-spacing: var(--pt-tracking-tight);
      line-height: var(--pt-line-tight);
    }
    .panel { padding: var(--pt-space-4); display: grid; gap: var(--pt-space-3); }
    .fold__head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      align-items: center;
      gap: var(--pt-space-2);
      cursor: pointer;
    }
    .fold__name { font-weight: var(--pt-weight-semibold); }
    .fold__code { color: var(--pt-color-ink-soft); font-size: var(--pt-font-sm); text-align: right; }
    .fold__actions { display: flex; align-items: center; }
    .fold__body {
      display: grid;
      gap: var(--pt-space-3);
      padding-top: var(--pt-space-3);
      border-top: 1px solid var(--pt-color-line);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; border-bottom: 1px solid var(--pt-color-line); text-align: left; vertical-align: top; }
    th { font-size: var(--pt-font-xs); letter-spacing: 0.04em; text-transform: uppercase; color: var(--pt-color-ink-soft); }
    table:not(.data) tbody tr { cursor: pointer; }
    .row-actions { width: 1%; text-align: right; white-space: nowrap; }
    .state { color: var(--pt-color-ink-soft); }
    .grid {
      display: grid;
      gap: var(--pt-space-3);
      padding-top: var(--pt-space-3);
      border-top: 1px solid var(--pt-color-line);
    }
    .num { text-align: right; }
  `,
})
export class TariffTablesComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly opened = signal<ReadonlySet<TariffTable>>(new Set());

  readonly tables = input.required<TariffTable[]>();
  readonly vars = input<TariffVarOption[]>([]);
  readonly productVars = input<TariffVarOption[]>([]);
  readonly calculatorId = input<number | string>(0);
  readonly title = input('Тарифные таблицы');
  readonly agentOpen = input(false);
  readonly gridCode = input<string | null>(null);
  readonly gridRows = input<CoefficientDataRow[]>([]);

  readonly changed = output<TariffTable[]>();
  readonly selected = output<TariffTable | null>();
  readonly agentToggle = output<void>();
  readonly saveGrid = output<void>();
  readonly rowsImported = output<CoefficientDataRow[]>();

  protected open(item: TariffTable): boolean {
    return this.opened().has(item);
  }

  protected showsGrid(item: TariffTable): boolean {
    return this.open(item) && !!item.varCode && item.varCode === this.gridCode();
  }

  protected dataColumns(item: TariffTable): TariffColumn[] {
    return [...(item.columns ?? [])].sort((a, b) => Number(a.nr) - Number(b.nr));
  }

  protected dataHeader(column: TariffColumn): string {
    const code = column.varCode;
    const fromCalc = this.vars().find((item) => item.varCode === code)?.varName;
    const fromProduct = this.productVars().find((item) => item.varCode === code)?.varName;
    return `${column.conditionOperator ?? ''} ${fromCalc || fromProduct || code}`.trim();
  }

  protected dataCell(row: CoefficientDataRow, index: number): string {
    const value = row.conditionValue?.[index];
    return value == null ? '' : String(value);
  }

  protected exportExcel(item: TariffTable): void {
    const columns = this.dataColumns(item);
    const headers = [...columns.map((column) => this.dataHeader(column)), 'Коэффициент'];
    const rows = this.gridRows().map((row) => [
      ...columns.map((_, index) => this.dataCell(row, index)),
      row.resultValue,
    ]);
    void exportCoefficientExcel(`coefficients_${item.varCode || 'data'}.xlsx`, headers, rows).catch(() => {
      this.snack.open('Не удалось выгрузить Excel', 'Закрыть', { duration: 3000 });
    });
  }

  protected importExcel(item: TariffTable): void {
    void pickCoefficientExcel(this.dataColumns(item).length).then((rows) => {
      if (!rows) {
        this.snack.open('Не удалось прочитать Excel', 'Закрыть', { duration: 3000 });
        return;
      }
      this.rowsImported.emit(rows);
      this.snack.open('Данные загружены. Сохраните таблицу.', 'Закрыть', { duration: 2500 });
    });
  }

  protected toggle(item: TariffTable): void {
    const next = new Set(this.opened());
    if (next.has(item)) {
      next.delete(item);
      this.selected.emit(null);
    } else {
      next.add(item);
      this.selected.emit(item);
    }
    this.opened.set(next);
  }

  protected addTable(): void {
    this.dialog.open(TariffTableDialogComponent, {
      width: '640px',
      data: { isNew: true, vars: this.vars() },
    }).afterClosed().subscribe((result: TariffTable | undefined) => {
      if (!result) {
        return;
      }
      const row: TariffTable = { ...result, columns: result.columns ?? [] };
      const next = [...this.tables(), row];
      this.changed.emit(next);
      this.toggle(row);
    });
  }

  protected editTable(row: TariffTable): void {
    this.dialog.open(TariffTableDialogComponent, {
      width: '640px',
      data: { isNew: false, table: row, vars: this.vars() },
    }).afterClosed().subscribe((result: TariffTable | undefined) => {
      if (!result) {
        return;
      }
      Object.assign(row, { ...result, columns: row.columns });
      this.changed.emit([...this.tables()]);
    });
  }

  protected deleteTable(row: TariffTable): void {
    const next = this.tables().filter((item) => item !== row);
    const open = new Set(this.opened());
    open.delete(row);
    this.opened.set(open);
    this.selected.emit(null);
    this.changed.emit(next);
  }

  protected addColumn(table: TariffTable): void {
    this.dialog.open(TariffColumnDialogComponent, {
      width: '640px',
      data: {
        isNew: true,
        vars: this.vars(),
        column: { varCode: '', varDataType: 'STRING', nr: String((table.columns?.length ?? 0) + 1), conditionOperator: '=', sortOrder: 'NONE' },
      },
    }).afterClosed().subscribe((result: TariffColumn | undefined) => {
      if (!result) {
        return;
      }
      table.columns = [...(table.columns ?? []), result];
      this.changed.emit([...this.tables()]);
    });
  }

  protected editColumn(table: TariffTable, column: TariffColumn): void {
    this.dialog.open(TariffColumnDialogComponent, {
      width: '640px',
      data: { isNew: false, column, vars: this.vars() },
    }).afterClosed().subscribe((result: TariffColumn | undefined) => {
      if (!result) {
        return;
      }
      Object.assign(column, result);
      table.columns = [...table.columns];
      this.changed.emit([...this.tables()]);
    });
  }

  protected deleteColumn(table: TariffTable, column: TariffColumn): void {
    table.columns = table.columns.filter((item) => item !== column);
    this.changed.emit([...this.tables()]);
  }

  protected showSql(table: TariffTable): void {
    const sql = buildCoefficientDataSql(this.calculatorId(), table.varCode, table.columns ?? []);
    if (!sql) {
      this.snack.open('Не удалось построить SQL: проверьте колонки (операторы и сортировку).', 'Закрыть', { duration: 4500 });
      return;
    }
    this.dialog.open(SqlDialogComponent, { width: '760px', data: { sql } });
  }
}
