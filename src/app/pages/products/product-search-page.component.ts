import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { InsuranceCompany, ProductSummary, ProductVersion, emptyProduct, workingVersion } from '../../core/api/catalog.models';
import { pickJsonFile } from '../../core/api/json-file';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { Breadcrumb, PtAction, PtColumn, PtRow, PtRowAction, PtRowActionEvent } from '../../shared/ui/platform.models';
import { FieldsDialogComponent } from '../../shared/ui/fields-dialog/fields-dialog.component';

@Component({
  selector: 'pt-product-search-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    SearchPageComponent,
  ],
  templateUrl: './product-search-page.component.html',
  styles: '.company-filter { width: 240px; max-width: 100%; }',
})
export class ProductSearchPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly query = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly companyId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly products = signal<ProductSummary[]>([]);
  protected readonly companies = signal<InsuranceCompany[]>([]);

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Обзор', route: '/dashboard' },
    { label: 'Продукты' },
  ];
  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '120px' },
    { key: 'name', label: 'Название' },
    { key: 'lob', label: 'Линия бизнеса', width: '160px' },
    { key: 'prod', label: 'Прод', width: '80px' },
    { key: 'dev', label: 'Dev', width: '80px' },
  ];
  protected readonly actions: PtAction[] = [
    { id: 'import', label: 'Из файла', icon: 'upload', tone: 'ghost' },
    { id: 'create', label: 'Новый продукт', icon: 'add', tone: 'accent' },
  ];
  protected readonly rowActions: PtRowAction[] = [
    { id: 'edit', label: 'Открыть', icon: 'edit' },
    { id: 'delete', label: 'Удалить', icon: 'delete', tone: 'danger' },
  ];

  protected readonly rows = computed<PtRow[]>(() => {
    const query = this.query().trim().toLowerCase();
    return this.products()
      .filter((item) => `${item.code} ${item.name} ${item.lob}`.toLowerCase().includes(query))
      .map((item) => ({
        id: String(item.id ?? item.code),
        code: item.code,
        name: item.name,
        lob: item.lob,
        prod: item.prodVersionNo == null ? '—' : String(item.prodVersionNo),
        dev: item.devVersionNo == null ? '—' : String(item.devVersionNo),
      }));
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const next = params.get('q') ?? '';
      if (next !== this.query()) {
        this.query.set(next);
      }
      const company = params.get('insComp');
      const parsed = company == null || company === '' ? null : Number(company);
      this.companyId.set(parsed != null && Number.isFinite(parsed) ? parsed : null);
    });
  }

  ngOnInit(): void {
    this.api.insuranceCompanies().subscribe({
      next: (items) => this.companies.set(items ?? []),
      error: () => this.companies.set([]),
    });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.products(this.companyId()).subscribe({
      next: (items) => {
        this.products.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.fail(error, 'Не удалось загрузить продукты');
      },
    });
  }

  protected onCompany(value: number | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { insComp: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.companyId.set(value);
    this.load();
  }

  protected onAction(id: string): void {
    if (id === 'create') {
      this.create();
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
    const product = this.products().find((item) => String(item.id ?? item.code) === row.id);
    if (!product?.id) {
      return;
    }
    void this.router.navigate(['/products', product.id, 'versions', workingVersion(product)]);
  }

  private create(): void {
    this.api.lobs().subscribe({
      next: (lobs) => {
        const ref = this.dialog.open(FieldsDialogComponent, {
          width: '480px',
          data: {
            title: 'Новый продукт',
            fields: [
              { key: 'lob', label: `Линия бизнеса (${lobs.map((item) => item.mpCode).join(', ') || 'код'})` },
              { key: 'code', label: 'Код' },
              { key: 'name', label: 'Название' },
            ],
            value: { lob: lobs[0]?.mpCode ?? '', code: '', name: '' },
          },
        });
        ref.afterClosed().subscribe((result) => {
          if (!result) {
            return;
          }
          const body = emptyProduct({
            lob: String(result['lob'] ?? '').trim(),
            code: String(result['code'] ?? '').trim(),
            name: String(result['name'] ?? '').trim(),
          });
          if (!body.lob || !body.code || !body.name) {
            this.snack.open('Укажите линию, код и название', 'Закрыть', { duration: 2500 });
            return;
          }
          this.api.createProduct(body).subscribe({
            next: (created) => this.openCreated(created),
            error: (error: unknown) => this.fail(error, 'Не удалось создать продукт'),
          });
        });
      },
      error: (error: unknown) => this.fail(error, 'Не удалось загрузить линии бизнеса'),
    });
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
    const body = emptyProduct(payload as ProductVersion);
    delete body.id;
    this.api.createProduct(body).subscribe({
      next: (created) => {
        this.snack.open('Продукт загружен', 'Закрыть', { duration: 2000 });
        this.openCreated(created);
      },
      error: (error: unknown) => this.fail(error, 'Не удалось загрузить продукт'),
    });
  }

  private openCreated(created: ProductVersion): void {
    if (created.id == null) {
      this.load();
      return;
    }
    void this.router.navigate(['/products', created.id, 'versions', created.versionNo ?? 0]);
  }

  private remove(row: PtRow): void {
    const product = this.products().find((item) => String(item.id ?? item.code) === row.id);
    if (!product?.id || !confirm(`Удалить продукт «${product.name}»?`)) {
      return;
    }
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.snack.open('Продукт удалён', 'Закрыть', { duration: 2000 });
        this.load();
      },
      error: (error: unknown) => this.fail(error, 'Не удалось удалить продукт'),
    });
  }

  private fail(error: unknown, fallback: string): void {
    this.snack.open(bffErrorMessage(error, fallback), 'Закрыть', { duration: 3500 });
  }
}
