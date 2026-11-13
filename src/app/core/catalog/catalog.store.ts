import { Injectable, signal } from '@angular/core';
import { CatalogRecord, Product, SEED_CALCULATORS, SEED_LINES, SEED_PRODUCTS } from './catalog.data';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  readonly products = signal<Product[]>(SEED_PRODUCTS.map((item) => ({ ...item })));
  readonly lines = signal<CatalogRecord[]>(SEED_LINES.map((item) => ({ ...item })));
  readonly calculators = signal<CatalogRecord[]>(SEED_CALCULATORS.map((item) => ({ ...item })));

  findProduct(code: string): Product | undefined {
    return this.products().find((item) => item.code.toLowerCase() === code.toLowerCase());
  }

  upsertProduct(product: Product): void {
    const current = this.products();
    const index = current.findIndex((item) => item.id === product.id || item.code === product.code);
    if (index === -1) {
      this.products.set([product, ...current]);
      return;
    }
    const next = current.slice();
    next[index] = product;
    this.products.set(next);
  }

  removeProduct(id: string): void {
    this.products.set(this.products().filter((item) => item.id !== id));
  }
}
