import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { ProductSummary, workingVersion } from '../../core/api/catalog.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'pt-dashboard-page',
  imports: [RouterLink, MatIconModule, PageHeaderComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  protected readonly products = signal<ProductSummary[]>([]);
  protected readonly lineCount = signal(0);
  protected readonly companyCount = signal(0);
  protected readonly devCount = computed(() => this.products().filter((item) => item.devVersionNo != null).length);
  protected readonly prodCount = computed(() => this.products().filter((item) => item.prodVersionNo != null).length);
  protected readonly versionOf = workingVersion;

  ngOnInit(): void {
    this.api.products().subscribe({
      next: (items) => this.products.set(items ?? []),
      error: () => this.products.set([]),
    });
    this.api.lobs().subscribe({
      next: (items) => this.lineCount.set(items?.length ?? 0),
      error: () => this.lineCount.set(0),
    });
    this.api.insuranceCompanies().subscribe({
      next: (items) => this.companyCount.set(items?.length ?? 0),
      error: () => this.companyCount.set(0),
    });
  }
}
