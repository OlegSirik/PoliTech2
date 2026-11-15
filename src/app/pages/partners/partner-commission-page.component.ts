import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { PartnerCommission } from '../../core/api/catalog.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

const ACTIONS = [
  { value: 'sale', label: 'Продажа' },
  { value: 'prolongation', label: 'Пролонгация' },
];

@Component({
  selector: 'pt-partner-commission-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './partner-commission-page.component.html',
  styleUrl: '../catalog/sheet.scss',
  styles: `h3 { margin: 16px 0 0; font-size: var(--pt-font-md); font-weight: var(--pt-weight-semibold); }`,
})
export class PartnerCommissionPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly actions = ACTIONS;
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly isNew = signal(true);
  protected readonly clientName = signal('');
  protected readonly productName = signal('');
  protected model: PartnerCommission = { accountId: 0, productId: 0, action: 'sale' };

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.clientName.set(query.get('clientName') || '');
    this.productName.set(query.get('productName') || '');
    const commissionId = this.route.snapshot.paramMap.get('commissionId');
    if (!commissionId || commissionId === 'new') {
      const accountId = Number(query.get('accountId'));
      const productId = Number(query.get('productId'));
      if (!accountId || !productId) {
        this.snack.open('Не указан продукт договора', 'Закрыть', { duration: 2500 });
        this.back();
        return;
      }
      this.isNew.set(true);
      this.model = { accountId, productId, action: 'sale' };
      return;
    }
    this.isNew.set(false);
    this.api.partnerCommission(Number(commissionId)).subscribe({
      next: (item) => {
        this.model = { ...item, action: item.action || 'sale' };
        this.dirty.set(false);
      },
      error: (error: unknown) => {
        this.snack.open(bffErrorMessage(error, 'Договор не найден'), 'Закрыть', { duration: 3000 });
        this.back();
      },
    });
  }

  protected partnerRoute(): string {
    return `/partners/${this.route.snapshot.paramMap.get('id')}`;
  }

  protected title(): string {
    const product = this.productName();
    return product ? `Агентский договор: ${product}` : 'Агентский договор';
  }

  protected maxRate(): number {
    const value = Number(this.model.rateValue);
    return Number.isFinite(value) ? value : 100;
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected back(): void {
    const id = this.route.snapshot.paramMap.get('id');
    void this.router.navigate(['/partners', id], {
      queryParams: { tab: 'products', productId: this.model.productId || null },
    });
  }

  protected save(): void {
    if (!this.model.accountId || !this.model.productId) {
      this.snack.open('Не указан продукт договора', 'Закрыть', { duration: 2500 });
      return;
    }
    const body: PartnerCommission = {
      ...this.model,
      action: this.model.action || 'sale',
      agdNumber: this.model.agdNumber?.trim() || undefined,
      rateValue: this.numberOrNull(this.model.rateValue),
      fixedAmount: this.numberOrNull(this.model.fixedAmount),
      commissionMinRate: this.numberOrNull(this.model.commissionMinRate),
      commissionMaxRate: this.numberOrNull(this.model.commissionMaxRate),
      minAmount: this.numberOrNull(this.model.minAmount),
      maxAmount: this.numberOrNull(this.model.maxAmount),
    };
    this.saving.set(true);
    const request = this.isNew() || body.id == null
      ? this.api.createPartnerCommission(body)
      : this.api.updatePartnerCommission(body.id, body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dirty.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
        this.back();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить договор'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  private numberOrNull(value: number | null | undefined): number | null {
    if (value == null || String(value) === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
}
