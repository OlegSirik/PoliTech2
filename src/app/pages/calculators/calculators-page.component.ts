import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { ProductPackage, ProductSummary, ProductVersion, workingVersion } from '../../core/api/catalog.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'pt-calculators-page',
  imports: [MatButtonModule, MatSnackBarModule, PageHeaderComponent],
  templateUrl: './calculators-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class CalculatorsPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly products = signal<ProductSummary[]>([]);
  protected readonly selected = signal<ProductSummary | null>(null);
  protected readonly version = signal<ProductVersion | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.api.products().subscribe({
      next: (items) => {
        this.products.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить продукты'), 'Закрыть', { duration: 3500 });
      },
    });
  }

  protected choose(product: ProductSummary): void {
    if (!product.id) {
      return;
    }
    this.selected.set(product);
    this.version.set(null);
    this.api.product(product.id, workingVersion(product)).subscribe({
      next: (value) => this.version.set(value),
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Версия продукта недоступна'), 'Закрыть', { duration: 3500 }),
    });
  }

  protected open(pkg: ProductPackage): void {
    const product = this.version();
    if (!product?.id) {
      return;
    }
    void this.router.navigate(['/products', product.id, 'versions', product.versionNo, 'packages', pkg.code, 'calculator']);
  }
}
