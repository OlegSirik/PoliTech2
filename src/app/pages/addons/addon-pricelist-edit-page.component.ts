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
import { AddonPricelist, AddonProductRef, ProductSummary } from '../../core/api/catalog.models';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AddonProductDialogComponent } from './addon-product-dialog.component';

function emptyPricelist(providerId: number): AddonPricelist {
  return { providerId, code: '', name: '', recordStatus: 'ACTIVE', price: null, amountFree: null, addonProducts: [] };
}

@Component({
  selector: 'pt-addon-pricelist-edit-page',
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
    ActionButtonComponent,
    PageHeaderComponent,
  ],
  templateUrl: './addon-pricelist-edit-page.component.html',
  styleUrl: '../catalog/sheet.scss',
  styles: `td input { width: 100%; box-sizing: border-box; }`,
})
export class AddonPricelistEditPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly isNew = signal(true);
  protected readonly providerName = signal('');
  protected readonly products = signal<ProductSummary[]>([]);
  protected pricelist: AddonPricelist = emptyPricelist(0);

  ngOnInit(): void {
    this.api.products().subscribe({
      next: (items) => this.products.set(items ?? []),
      error: () => this.products.set([]),
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      const providerId = Number(this.route.snapshot.queryParamMap.get('providerId'));
      if (!providerId) {
        this.snack.open('Сначала выберите поставщика', 'Закрыть', { duration: 2500 });
        this.back();
        return;
      }
      this.isNew.set(true);
      this.pricelist = emptyPricelist(providerId);
      this.loadProvider(providerId);
      return;
    }
    this.isNew.set(false);
    this.api.addonPricelist(Number(id)).subscribe({
      next: (pricelist) => {
        this.pricelist = {
          ...emptyPricelist(pricelist.providerId),
          ...pricelist,
          recordStatus: pricelist.recordStatus || 'ACTIVE',
          addonProducts: pricelist.addonProducts ?? [],
        };
        this.loadProvider(pricelist.providerId);
      },
      error: (error: unknown) => {
        this.snack.open(bffErrorMessage(error, 'Услуга не найдена'), 'Закрыть', { duration: 3000 });
        this.back();
      },
    });
  }

  protected title(): string {
    const name = this.pricelist.name?.trim();
    if (!name) {
      return this.isNew() ? 'Новая услуга' : 'Услуга';
    }
    return [name, this.providerName()].filter(Boolean).join(' / ');
  }

  protected productName(productId: number): string {
    const product = this.products().find((item) => item.id === productId);
    return product ? (product.name || product.code || String(productId)) : String(productId);
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected back(): void {
    void this.router.navigate(['/addons']);
  }

  protected addProduct(): void {
    const used = new Set((this.pricelist.addonProducts ?? []).map((item) => item.productId));
    const available = this.products().filter((product) => product.id != null && !used.has(product.id));
    this.dialog.open(AddonProductDialogComponent, {
      width: '480px',
      data: { products: available },
    }).afterClosed().subscribe((productId: number | undefined) => {
      if (productId == null) {
        return;
      }
      this.pricelist.addonProducts = [...(this.pricelist.addonProducts ?? []), { productId, preconditions: '' }];
      this.persistLinks('Продукт добавлен');
    });
  }

  protected removeProduct(productId: number): void {
    this.pricelist.addonProducts = (this.pricelist.addonProducts ?? []).filter((item) => item.productId !== productId);
    this.persistLinks('Продукт удалён');
  }

  protected save(): void {
    const code = this.pricelist.code?.trim() ?? '';
    const name = this.pricelist.name?.trim() ?? '';
    if (!code || !name) {
      this.snack.open('Укажите код и название', 'Закрыть', { duration: 2500 });
      return;
    }
    if (!this.pricelist.providerId) {
      this.snack.open('Не выбран поставщик', 'Закрыть', { duration: 2500 });
      return;
    }
    const body = this.payload(code, name);
    this.saving.set(true);
    const request = this.isNew() || this.pricelist.id == null
      ? this.api.createAddonPricelist(body)
      : this.api.updateAddonPricelist(this.pricelist.id, body);
    request.subscribe({
      next: (saved) => this.saved(saved),
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить услугу'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  private persistLinks(message: string): void {
    if (this.isNew() || this.pricelist.id == null) {
      this.touch();
      return;
    }
    this.api.updateAddonPricelist(this.pricelist.id, this.payload(this.pricelist.code, this.pricelist.name)).subscribe({
      next: (saved) => {
        this.pricelist = {
          ...emptyPricelist(saved.providerId),
          ...saved,
          recordStatus: saved.recordStatus || 'ACTIVE',
          addonProducts: saved.addonProducts ?? [],
        };
        this.snack.open(message, 'Закрыть', { duration: 2000 });
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось обновить продукты'), 'Закрыть', { duration: 3000 }),
    });
  }

  private payload(code: string, name: string): AddonPricelist {
    return {
      ...this.pricelist,
      code,
      name,
      recordStatus: this.pricelist.recordStatus || 'ACTIVE',
      price: this.numberOrNull(this.pricelist.price),
      amountFree: this.numberOrNull(this.pricelist.amountFree),
      addonProducts: (this.pricelist.addonProducts ?? []).map((item) => this.link(item)),
    };
  }

  private link(item: AddonProductRef): AddonProductRef {
    return { productId: item.productId, preconditions: item.preconditions ?? '' };
  }

  private numberOrNull(value: number | null | undefined): number | null {
    if (value == null || String(value) === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private saved(saved: AddonPricelist): void {
    this.pricelist = {
      ...emptyPricelist(saved.providerId),
      ...saved,
      recordStatus: saved.recordStatus || 'ACTIVE',
      addonProducts: saved.addonProducts ?? [],
    };
    this.isNew.set(false);
    this.dirty.set(false);
    this.saving.set(false);
    this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
    if (saved.id != null && this.route.snapshot.paramMap.get('id') !== String(saved.id)) {
      void this.router.navigate(['/addons', 'pricelists', saved.id], { replaceUrl: true });
    }
  }

  private loadProvider(id: number): void {
    if (!id) {
      return;
    }
    this.api.addonProvider(id).subscribe({
      next: (provider) => this.providerName.set(provider.name || ''),
      error: () => this.providerName.set(''),
    });
  }
}
