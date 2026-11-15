import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { AddonPricelist, AddonProvider } from '../../core/api/catalog.models';
import { statusClass as ptStatusClass } from '../../shared/ui/platform.models';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'pt-addons-page',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, ActionButtonComponent, PageHeaderComponent],
  templateUrl: './addons-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class AddonsPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly loadingPricelists = signal(false);
  protected readonly providers = signal<AddonProvider[]>([]);
  protected readonly pricelists = signal<AddonPricelist[]>([]);
  protected readonly selectedId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadProviders();
  }

  protected status(value?: string): string {
    return value || 'ACTIVE';
  }

  protected statusClass(value?: string): string {
    return ptStatusClass(value || '');
  }

  protected price(value?: number | null): string {
    return value == null ? '—' : String(value);
  }

  protected selectProvider(provider: AddonProvider): void {
    if (provider.id == null) {
      return;
    }
    if (this.selectedId() === provider.id) {
      this.selectedId.set(null);
      this.pricelists.set([]);
      return;
    }
    this.selectedId.set(provider.id);
    this.loadPricelists(provider.id);
  }

  protected addProvider(): void {
    void this.router.navigate(['/addons', 'providers', 'new']);
  }

  protected editProvider(provider: AddonProvider): void {
    if (provider.id == null) {
      return;
    }
    void this.router.navigate(['/addons', 'providers', provider.id]);
  }

  protected suspendProvider(provider: AddonProvider): void {
    if (provider.id == null) {
      return;
    }
    this.api.suspendAddonProvider(provider.id).subscribe({
      next: () => {
        if (this.selectedId() === provider.id) {
          this.selectedId.set(null);
          this.pricelists.set([]);
        }
        this.snack.open('Поставщик приостановлен', 'Закрыть', { duration: 2000 });
        this.loadProviders();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось приостановить поставщика'), 'Закрыть', { duration: 3000 }),
    });
  }

  protected addPricelist(): void {
    const providerId = this.selectedId();
    if (providerId == null) {
      this.snack.open('Сначала выберите поставщика', 'Закрыть', { duration: 2500 });
      return;
    }
    void this.router.navigate(['/addons', 'pricelists', 'new'], { queryParams: { providerId } });
  }

  protected editPricelist(pricelist: AddonPricelist): void {
    if (pricelist.id == null) {
      return;
    }
    void this.router.navigate(['/addons', 'pricelists', pricelist.id]);
  }

  protected deletePricelist(pricelist: AddonPricelist): void {
    if (pricelist.id == null) {
      return;
    }
    this.api.deleteAddonPricelist(pricelist.id).subscribe({
      next: () => {
        this.snack.open('Услуга удалена', 'Закрыть', { duration: 2000 });
        const providerId = this.selectedId();
        if (providerId != null) {
          this.loadPricelists(providerId);
        }
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось удалить услугу'), 'Закрыть', { duration: 3000 }),
    });
  }

  private loadProviders(): void {
    this.loading.set(true);
    this.api.addonProviders().subscribe({
      next: (items) => {
        this.providers.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить поставщиков'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  private loadPricelists(providerId: number): void {
    this.loadingPricelists.set(true);
    this.api.addonPricelists(providerId).subscribe({
      next: (items) => {
        this.pricelists.set(items ?? []);
        this.loadingPricelists.set(false);
      },
      error: (error: unknown) => {
        this.loadingPricelists.set(false);
        this.pricelists.set([]);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить услуги'), 'Закрыть', { duration: 3000 });
      },
    });
  }
}
