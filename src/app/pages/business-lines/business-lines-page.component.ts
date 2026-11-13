import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { LobDocument, LobSummary, normalizeLob } from '../../core/api/catalog.models';
import { pickJsonFile } from '../../core/api/json-file';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { Breadcrumb, PtAction, PtColumn, PtRow, PtRowAction, PtRowActionEvent } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-business-lines-page',
  imports: [MatSnackBarModule, SearchPageComponent],
  templateUrl: './business-lines-page.component.html',
})
export class BusinessLinesPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly lines = signal<LobSummary[]>([]);
  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Обзор', route: '/dashboard' },
    { label: 'Линии бизнеса' },
  ];
  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '160px' },
    { key: 'name', label: 'Название' },
  ];
  protected readonly actions: PtAction[] = [
    { id: 'import', label: 'Из файла', icon: 'upload', tone: 'ghost' },
    { id: 'create', label: 'Новая линия', icon: 'add', tone: 'accent' },
  ];
  protected readonly rowActions: PtRowAction[] = [
    { id: 'edit', label: 'Открыть', icon: 'edit' },
    { id: 'delete', label: 'Удалить', icon: 'delete', tone: 'danger' },
  ];
  protected readonly rows = computed<PtRow[]>(() => {
    const query = this.query().trim().toLowerCase();
    return this.lines()
      .filter((item) => `${item.mpCode} ${item.mpName}`.toLowerCase().includes(query))
      .map((item) => ({ id: String(item.id), code: item.mpCode, name: item.mpName }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.lobs().subscribe({
      next: (items) => {
        this.lines.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить линии бизнеса'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected onAction(id: string): void {
    if (id === 'create') {
      void this.router.navigate(['/business-lines', 'new']);
      return;
    }
    void this.importFile();
  }

  protected onRowAction(event: PtRowActionEvent): void {
    if (event.id === 'delete') {
      this.remove(event.row);
      return;
    }
    this.open(event.row);
  }

  protected open(row: PtRow): void {
    void this.router.navigate(['/business-lines', row.id]);
  }

  private async importFile(): Promise<void> {
    const payload = await pickJsonFile();
    if (payload === undefined) {
      this.snack.open('Файл содержит некорректный JSON', 'Закрыть', { duration: 3000 });
      return;
    }
    if (!payload || typeof payload !== 'object') {
      return;
    }
    const body = normalizeLob(payload as LobDocument);
    delete body.id;
    this.api.createLob(body).subscribe({
      next: (created) => {
        this.snack.open('Линия бизнеса загружена', 'Закрыть', { duration: 2000 });
        if (created.id) {
          void this.router.navigate(['/business-lines', created.id]);
        } else {
          this.load();
        }
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось загрузить линию'), 'Закрыть', { duration: 3500 }),
    });
  }

  private remove(row: PtRow): void {
    const line = this.lines().find((item) => String(item.id) === row.id);
    if (!line || !confirm(`Удалить линию «${line.mpName}»?`)) {
      return;
    }
    this.api.deleteLob(line.id).subscribe({
      next: () => {
        this.snack.open('Линия удалена', 'Закрыть', { duration: 2000 });
        this.load();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось удалить линию'), 'Закрыть', { duration: 3500 }),
    });
  }
}
