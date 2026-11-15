import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { InsuranceCompany } from '../../core/api/catalog.models';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { PtAction, PtColumn, PtRow, PtRowAction } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-ins-companies-page',
  imports: [MatSnackBarModule, SearchPageComponent],
  templateUrl: './ins-companies-page.component.html',
})
export class InsCompaniesPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly query = signal('');
  protected readonly companies = signal<InsuranceCompany[]>([]);

  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '140px' },
    { key: 'name', label: 'Название' },
    { key: 'status', label: 'Статус', kind: 'status', width: '140px' },
  ];
  protected readonly actions: PtAction[] = [
    { id: 'create', label: 'Новая компания', icon: 'add', tone: 'accent' },
  ];
  protected readonly rowActions: PtRowAction[] = [
    { id: 'edit', label: 'Изменить', icon: 'edit' },
  ];

  protected readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.companies()
      .filter((company) => `${company.code ?? ''} ${company.name ?? ''} ${company.shortName ?? ''}`.toLowerCase().includes(query))
      .map((company) => ({
        id: String(company.id ?? company.code),
        code: company.code || '—',
        name: company.name || '—',
        status: company.status || '—',
      }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.insuranceCompanies().subscribe({
      next: (items) => {
        this.companies.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить страховые компании'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  protected onAction(id: string): void {
    if (id === 'create') {
      void this.router.navigate(['/ins-companies', 'new']);
    }
  }

  protected open(row: PtRow): void {
    void this.router.navigate(['/ins-companies', row.id]);
  }
}
