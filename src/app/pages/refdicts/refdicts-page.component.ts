import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { RefDataItem, RefDict, RefDictsService } from '../../core/api/refdicts.service';
import { RefDictsNavigatorService } from '../../core/api/refdicts-navigator.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PtAction } from '../../shared/ui/platform.models';
import { RefDictEntryDialogComponent } from './refdict-entry-dialog.component';

type PageMode = 'edit' | 'select';

@Component({
  selector: 'pt-refdicts-page',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './refdicts-page.component.html',
  styleUrl: './refdicts-page.component.scss',
})
export class RefDictsPageComponent implements OnInit {
  private readonly api = inject(RefDictsService);
  private readonly navigator = inject(RefDictsNavigatorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly mode = signal<PageMode>('edit');
  protected readonly dicts = signal<RefDict[]>([]);
  protected readonly items = signal<RefDataItem[]>([]);
  protected readonly selectedDictCode = signal<string | null>(null);
  protected readonly loadingDicts = signal(false);
  protected readonly loadingItems = signal(false);
  protected readonly selectedValues = signal('');
  private readonly selectedSet = new Set<string>();
  private returnUrl = '';
  protected readonly headerActions = computed<PtAction[]>(() => this.mode() === 'select'
    ? [
        { id: 'cancel', label: 'Отмена', tone: 'ghost' },
        { id: 'ok', label: 'Выбрать' },
      ]
    : []);

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'] === 'select' ? 'select' : 'edit';
    this.mode.set(mode);
    if (mode === 'select') {
      this.initSelect();
      return;
    }
    this.loadDicts();
  }

  protected selectDict(dict: RefDict): void {
    this.selectedDictCode.set(dict.code);
    this.loadItems();
  }

  protected isSelected(code: string): boolean {
    return this.selectedSet.has(code);
  }

  protected toggleSelection(code: string, checked: boolean): void {
    if (checked) {
      this.selectedSet.add(code);
    } else {
      this.selectedSet.delete(code);
    }
    const value = [...this.selectedSet].join(',');
    this.selectedValues.set(value);
    const dictCode = this.selectedDictCode();
    if (dictCode) {
      this.navigator.setSessionSelected(dictCode, value);
    }
  }

  protected addDict(): void {
    this.openDialog('Добавить справочник', '', '', true).subscribe((result) => {
      if (!result) {
        return;
      }
      this.api.createDict(result).subscribe({
        next: () => {
          this.snack.open('Справочник создан', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
          this.loadDicts();
        },
        error: (error: unknown) => this.fail(error, 'Ошибка создания справочника'),
      });
    });
  }

  protected editDict(dict: RefDict, event: Event): void {
    event.stopPropagation();
    this.openDialog('Редактировать справочник', dict.code, dict.name, false).subscribe((result) => {
      if (!result || (result.code === dict.code && result.name === dict.name)) {
        return;
      }
      this.api.updateDict(dict.code, result).subscribe({
        next: () => {
          if (this.selectedDictCode() === dict.code) {
            this.selectedDictCode.set(result.code);
          }
          this.snack.open('Справочник обновлён', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
          this.loadDicts();
          if (this.selectedDictCode() === result.code) {
            this.loadItems();
          }
        },
        error: (error: unknown) => this.fail(error, 'Ошибка обновления справочника'),
      });
    });
  }

  protected deleteDict(dict: RefDict, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Удалить справочник ${dict.code}?`)) {
      return;
    }
    this.api.deleteDict(dict.code).subscribe({
      next: () => {
        if (this.selectedDictCode() === dict.code) {
          this.selectedDictCode.set(null);
          this.items.set([]);
        }
        this.snack.open('Справочник удалён', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
        this.loadDicts();
      },
      error: (error: unknown) => this.fail(error, 'Ошибка удаления справочника'),
    });
  }

  protected addItem(): void {
    const dictCode = this.selectedDictCode();
    if (!dictCode) {
      return;
    }
    this.openDialog('Добавить значение', '', '', true).subscribe((result) => {
      if (!result) {
        return;
      }
      this.api.createItem(dictCode, result).subscribe({
        next: () => {
          this.snack.open('Значение добавлено', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
          this.loadItems();
        },
        error: (error: unknown) => this.fail(error, 'Ошибка добавления значения'),
      });
    });
  }

  protected editItem(item: RefDataItem, event: Event): void {
    event.stopPropagation();
    const dictCode = this.selectedDictCode();
    if (!dictCode) {
      return;
    }
    this.openDialog('Редактировать значение', item.code, item.name, false).subscribe((result) => {
      if (!result || (result.code === item.code && result.name === item.name)) {
        return;
      }
      this.api.updateItem(dictCode, item.code, result).subscribe({
        next: () => {
          this.snack.open('Значение обновлено', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
          this.loadItems();
        },
        error: (error: unknown) => this.fail(error, 'Ошибка обновления значения'),
      });
    });
  }

  protected deleteItem(item: RefDataItem, event: Event): void {
    event.stopPropagation();
    const dictCode = this.selectedDictCode();
    if (!dictCode || !confirm(`Удалить значение ${item.code}?`)) {
      return;
    }
    this.api.deleteItem(dictCode, item.code).subscribe({
      next: () => {
        this.snack.open('Значение удалено', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
        this.loadItems();
      },
      error: (error: unknown) => this.fail(error, 'Ошибка удаления значения'),
    });
  }

  protected confirmSelect(): void {
    this.leave('ok');
  }

  protected onHeader(id: string): void {
    if (id === 'ok') {
      this.confirmSelect();
      return;
    }
    this.cancelSelect();
  }

  protected cancelSelect(): void {
    this.leave('cancel');
  }

  private initSelect(): void {
    const dictCode = this.route.snapshot.queryParamMap.get('dictCode')?.trim() ?? '';
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')?.trim() ?? '';
    const fromQuery = this.route.snapshot.queryParamMap.get('selected')?.trim() ?? '';
    const selected = fromQuery || this.navigator.getSessionSelected(dictCode);
    this.selectedValues.set(selected);
    selected.split(',').map((item) => item.trim()).filter(Boolean).forEach((item) => this.selectedSet.add(item));
    if (!dictCode) {
      this.snack.open('Не указан код справочника', 'Закрыть', { duration: 3000 });
      return;
    }
    this.selectedDictCode.set(dictCode);
    this.loadItems();
  }

  private loadDicts(): void {
    this.loadingDicts.set(true);
    this.api.listDicts().subscribe({
      next: (dicts) => {
        this.dicts.set(dicts ?? []);
        this.loadingDicts.set(false);
        if (!this.selectedDictCode() && dicts?.length) {
          this.selectDict(dicts[0]);
        }
      },
      error: (error: unknown) => {
        this.loadingDicts.set(false);
        this.fail(error, 'Ошибка загрузки справочников');
      },
    });
  }

  private loadItems(): void {
    const dictCode = this.selectedDictCode();
    if (!dictCode) {
      this.items.set([]);
      return;
    }
    this.loadingItems.set(true);
    this.api.listItems(dictCode).subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loadingItems.set(false);
      },
      error: (error: unknown) => {
        this.loadingItems.set(false);
        this.fail(error, 'Ошибка загрузки значений');
      },
    });
  }

  private leave(action: 'ok' | 'cancel'): void {
    const target = this.returnUrl.startsWith('/') && !this.returnUrl.startsWith('//') ? this.returnUrl : '/refdicts';
    void this.router.navigateByUrl(target, {
      state: {
        [RefDictsNavigatorService.RESULT_STATE_KEY]: {
          action,
          dictCode: this.selectedDictCode() ?? '',
          selected: action === 'ok' ? this.selectedValues() : '',
        },
      },
    });
  }

  private openDialog(title: string, code: string, name: string, isNew: boolean) {
    return this.dialog.open(RefDictEntryDialogComponent, {
      width: '480px',
      data: { title, code, name, isNew },
    }).afterClosed();
  }

  private fail(error: unknown, fallback: string): void {
    this.snack.open(bffErrorMessage(error, fallback), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' });
  }
}
