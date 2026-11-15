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
import { Partner, PartnerCommission, PartnerConfiguration, PartnerMember, PartnerProduct, ProductSummary } from '../../core/api/catalog.models';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PartnerAdminDialogComponent, PartnerMemberDialogComponent, PartnerProductDialogComponent } from './partner-dialogs';

const ACTIONS = [
  { value: 'sale', label: 'Продажа' },
  { value: 'prolongation', label: 'Пролонгация' },
];

function emptyConfig(): PartnerConfiguration {
  return { paymentGate: '', sendEmailAfterBuy: false, sendSmsAfterBuy: false };
}

function emptyPartner(): Partner {
  return {
    authClientId: '',
    name: '',
    recordStatus: 'ACTIVE',
    authType: '',
    authLevel: 'CLIENT',
    clientConfiguration: emptyConfig(),
  };
}

@Component({
  selector: 'pt-partner-edit-page',
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
  templateUrl: './partner-edit-page.component.html',
  styleUrl: '../catalog/sheet.scss',
  styles: `
    .wide { overflow-x: auto; }
    .wide table { min-width: 960px; }
    h3 { margin: 0; font-size: var(--pt-font-lg); font-weight: var(--pt-weight-semibold); }
  `,
})
export class PartnerEditPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly actions = ACTIONS;
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly isNew = signal(true);
  protected readonly tabIndex = signal(0);
  protected readonly products = signal<PartnerProduct[]>([]);
  protected readonly catalog = signal<ProductSummary[]>([]);
  protected readonly commissions = signal<PartnerCommission[]>([]);
  protected readonly admins = signal<PartnerMember[]>([]);
  protected readonly selectedProductId = signal<number | null>(null);
  protected partner: Partner = emptyPartner();

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'products') {
      this.tabIndex.set(1);
    } else if (tab === 'admins') {
      this.tabIndex.set(2);
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      this.partner = emptyPartner();
      return;
    }
    this.isNew.set(false);
    this.api.partner(Number(id)).subscribe({
      next: (partner) => {
        this.partner = this.normalize(partner);
        this.dirty.set(false);
        this.loadCatalog();
        this.loadProducts(Number(this.route.snapshot.queryParamMap.get('productId')) || null);
        this.loadAdmins();
      },
      error: (error: unknown) => {
        this.snack.open(bffErrorMessage(error, 'Партнер не найден'), 'Закрыть', { duration: 3000 });
        this.back();
      },
    });
  }

  protected title(): string {
    return this.isNew() ? 'Новый партнер' : (this.partner.name || 'Партнер');
  }

  protected config(): PartnerConfiguration {
    if (!this.partner.clientConfiguration) {
      this.partner.clientConfiguration = emptyConfig();
    }
    return this.partner.clientConfiguration;
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected back(): void {
    void this.router.navigate(['/partners']);
  }

  protected productLabel(item: PartnerProduct): string {
    return item.productName || item.roleProductName || '—';
  }

  protected actionLabel(action: string): string {
    return ACTIONS.find((item) => item.value === action)?.label || action || '—';
  }

  protected amount(value?: number | null): string {
    return value == null ? '—' : String(value);
  }

  protected save(): void {
    const authClientId = this.partner.authClientId?.trim() ?? '';
    const name = this.partner.name?.trim() ?? '';
    if (!authClientId || !name) {
      this.snack.open('Укажите Client ID и название', 'Закрыть', { duration: 2500 });
      return;
    }
    const body: Partner = {
      ...this.partner,
      authClientId,
      name,
      recordStatus: this.partner.recordStatus || 'ACTIVE',
      authLevel: this.partner.authLevel || 'CLIENT',
      authType: this.partner.authType || '',
      clientConfiguration: { ...this.config() },
    };
    this.saving.set(true);
    const request = this.isNew() || this.partner.id == null
      ? this.api.createPartner(body)
      : this.api.updatePartner(this.partner.id, body);
    request.subscribe({
      next: (saved) => {
        this.partner = this.normalize(saved);
        this.isNew.set(false);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
        if (saved.id != null && this.route.snapshot.paramMap.get('id') !== String(saved.id)) {
          void this.router.navigate(['/partners', saved.id], { replaceUrl: true });
        }
        if (saved.id != null) {
          this.loadCatalog();
          this.loadProducts(null);
          this.loadAdmins();
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить партнера'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  protected addProduct(): void {
    if (this.partner.id == null) {
      return;
    }
    this.dialog.open(PartnerProductDialogComponent, {
      width: '480px',
      data: { products: this.catalog() },
    }).afterClosed().subscribe((productId: number | undefined) => {
      if (productId == null || this.partner.id == null) {
        return;
      }
      const product = this.catalog().find((item) => item.id === productId);
      if (!product?.id) {
        return;
      }
      this.api.grantPartnerProduct(this.partner.id, {
        lobCode: product.lob,
        roleProductId: product.id,
        productCode: product.code,
        productName: product.name,
        roleProductName: product.name,
        isDeleted: false,
      }).subscribe({
        next: () => {
          this.snack.open('Продукт добавлен', 'Закрыть', { duration: 2000 });
          this.loadProducts(product.id ?? null);
        },
        error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось добавить продукт'), 'Закрыть', { duration: 3000 }),
      });
    });
  }

  protected selectProduct(item: PartnerProduct): void {
    this.selectedProductId.set(this.selectedProductId() === item.id ? null : (item.id ?? null));
    this.loadCommissions();
  }

  protected selectedProduct(): PartnerProduct | null {
    return this.products().find((item) => item.id === this.selectedProductId()) ?? null;
  }

  protected removeProduct(item: PartnerProduct): void {
    if (this.partner.id == null || item.id == null) {
      return;
    }
    this.api.revokePartnerProduct(this.partner.id, item.id).subscribe({
      next: () => {
        if (this.selectedProductId() === item.id) {
          this.selectedProductId.set(null);
          this.commissions.set([]);
        }
        this.snack.open('Продукт удалён', 'Закрыть', { duration: 2000 });
        this.loadProducts(null);
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось удалить продукт'), 'Закрыть', { duration: 3000 }),
    });
  }

  protected addCommission(): void {
    const product = this.selectedProduct();
    const accountId = product?.accountId ?? this.partner.clientAccountId;
    if (this.partner.id == null || product == null || accountId == null) {
      this.snack.open('У партнера нет аккаунта для договора', 'Закрыть', { duration: 2500 });
      return;
    }
    void this.router.navigate(['/partners', this.partner.id, 'commissions', 'new'], {
      queryParams: {
        accountId,
        productId: product.roleProductId,
        productName: this.productLabel(product),
        clientName: this.partner.name,
      },
    });
  }

  protected openCommission(item: PartnerCommission): void {
    const product = this.selectedProduct();
    if (this.partner.id == null || item.id == null || product == null) {
      return;
    }
    void this.router.navigate(['/partners', this.partner.id, 'commissions', item.id], {
      queryParams: {
        productName: this.productLabel(product),
        clientName: this.partner.name,
        productId: product.roleProductId,
      },
    });
  }

  protected removeCommission(item: PartnerCommission): void {
    if (item.id == null) {
      return;
    }
    this.api.deletePartnerCommission(item.id).subscribe({
      next: () => {
        this.snack.open('Договор удалён', 'Закрыть', { duration: 2000 });
        this.loadCommissions();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось удалить договор'), 'Закрыть', { duration: 3000 }),
    });
  }

  protected addAdmin(): void {
    if (this.partner.id == null) {
      return;
    }
    this.dialog.open(PartnerAdminDialogComponent, { width: '480px' }).afterClosed().subscribe((login: string | undefined) => {
      if (!login || this.partner.id == null) {
        return;
      }
      this.api.addPartnerMember(this.partner.id, { role: 'GROUP_ADMIN', userLogin: login }).subscribe({
        next: () => {
          this.snack.open('Администратор добавлен', 'Закрыть', { duration: 2000 });
          this.loadAdmins();
        },
        error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось добавить администратора'), 'Закрыть', { duration: 3000 }),
      });
    });
  }

  protected showAdmin(member: PartnerMember): void {
    this.dialog.open(PartnerMemberDialogComponent, { width: '480px', data: { member } });
  }

  protected removeAdmin(member: PartnerMember): void {
    if (this.partner.id == null) {
      return;
    }
    this.api.deletePartnerMember(this.partner.id, member.id).subscribe({
      next: () => {
        this.snack.open('Администратор удалён', 'Закрыть', { duration: 2000 });
        this.loadAdmins();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось удалить администратора'), 'Закрыть', { duration: 3000 }),
    });
  }

  private normalize(partner: Partner): Partner {
    return {
      ...emptyPartner(),
      ...partner,
      recordStatus: partner.recordStatus || 'ACTIVE',
      authLevel: partner.authLevel || 'CLIENT',
      authType: partner.authType || '',
      clientConfiguration: { ...emptyConfig(), ...partner.clientConfiguration },
    };
  }

  private loadCatalog(): void {
    this.api.products().subscribe({
      next: (items) => this.catalog.set(items ?? []),
      error: () => this.catalog.set([]),
    });
  }

  private loadProducts(selectRoleId: number | null): void {
    if (this.partner.id == null) {
      return;
    }
    this.api.partnerProducts(this.partner.id).subscribe({
      next: (items) => {
        this.products.set(items ?? []);
        const current = selectRoleId == null
          ? this.selectedProductId()
          : (items ?? []).find((item) => item.roleProductId === selectRoleId || item.id === selectRoleId)?.id ?? null;
        this.selectedProductId.set(current ?? null);
        this.loadCommissions();
      },
      error: (error: unknown) => {
        this.products.set([]);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить продукты'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  private loadCommissions(): void {
    const product = this.selectedProduct();
    const accountId = product?.accountId ?? this.partner.clientAccountId;
    if (product == null || accountId == null) {
      this.commissions.set([]);
      return;
    }
    this.api.partnerCommissions(accountId, product.roleProductId).subscribe({
      next: (items) => this.commissions.set(items ?? []),
      error: (error: unknown) => {
        this.commissions.set([]);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить договоры'), 'Закрыть', { duration: 3000 });
      },
    });
  }

  private loadAdmins(): void {
    if (this.partner.id == null) {
      return;
    }
    this.api.partnerMembers(this.partner.id, 'group_admin').subscribe({
      next: (items) => this.admins.set(items ?? []),
      error: (error: unknown) => {
        this.admins.set([]);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить администраторов'), 'Закрыть', { duration: 3000 });
      },
    });
  }
}
