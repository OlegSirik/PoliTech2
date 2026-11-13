import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CURRENCIES, PRODUCT_STATUSES, Product } from '../../core/catalog/catalog.data';
import { CatalogStore } from '../../core/catalog/catalog.store';
import { EditPageComponent } from '../../shared/ui/edit-page/edit-page.component';
import { PropertyDrawerComponent } from '../../shared/ui/property-drawer/property-drawer.component';
import { Breadcrumb } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-product-edit-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    EditPageComponent,
    PropertyDrawerComponent,
  ],
  templateUrl: './product-edit-page.component.html',
  styleUrl: './product-edit-page.component.scss',
})
export class ProductEditPageComponent {
  private readonly store = inject(CatalogStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly code = input.required<string>();

  protected readonly statuses = PRODUCT_STATUSES;
  protected readonly currencies = CURRENCIES;
  protected readonly drawerOpen = signal(true);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly missing = signal(false);
  protected readonly heading = signal('Новый продукт');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    line: ['', Validators.required],
    version: ['1', Validators.required],
    status: ['Черновик', Validators.required],
    currency: ['RUB', Validators.required],
    effectiveFrom: [''],
    effectiveTo: [''],
    description: [''],
  });

  protected readonly details = signal(this.form.getRawValue());
  private currentId: string | null = null;

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Обзор', route: '/dashboard' },
    { label: 'Продукты', route: '/products' },
    { label: this.heading() },
  ]);

  constructor() {
    this.form.valueChanges.subscribe(() => {
      this.dirty.set(this.form.dirty);
      this.details.set(this.form.getRawValue());
    });

    effect(() => {
      const code = this.code();
      if (code === 'new') {
        this.currentId = null;
        this.missing.set(false);
        this.heading.set('Новый продукт');
        this.form.reset({
          code: '',
          name: '',
          line: '',
          version: '1',
          status: 'Черновик',
          currency: 'RUB',
          effectiveFrom: '',
          effectiveTo: '',
          description: '',
        });
        this.dirty.set(false);
        return;
      }

      const product = this.store.findProduct(code);
      if (!product) {
        this.missing.set(true);
        this.heading.set(code);
        return;
      }

      this.currentId = product.id;
      this.missing.set(false);
      this.heading.set(product.name);
      this.form.reset({
        code: product.code,
        name: product.name,
        line: product.line,
        version: product.version,
        status: product.status,
        currency: product.currency,
        effectiveFrom: product.effectiveFrom,
        effectiveTo: product.effectiveTo,
        description: product.description,
      });
      this.dirty.set(false);
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const product: Product = {
      id: this.currentId ?? value.code.trim().toLowerCase(),
      code: value.code.trim(),
      name: value.name.trim(),
      line: value.line.trim(),
      version: value.version.trim(),
      status: value.status,
      currency: value.currency,
      effectiveFrom: value.effectiveFrom,
      effectiveTo: value.effectiveTo,
      description: value.description.trim(),
    };

    this.saving.set(true);
    this.store.upsertProduct(product);
    this.currentId = product.id;
    this.form.markAsPristine();
    this.dirty.set(false);
    this.heading.set(product.name);
    this.saving.set(false);
    this.snack.open('Сохранено в сессии браузера', 'Закрыть', {
      duration: 2500,
      panelClass: 'pt-snack-success',
    });

    if (this.code() === 'new') {
      void this.router.navigate(['/products', product.code]);
    }
  }

  protected cancel(): void {
    void this.router.navigate(['/products']);
  }
}
