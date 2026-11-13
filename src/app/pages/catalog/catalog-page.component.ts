import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CatalogStore } from '../../core/catalog/catalog.store';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { Breadcrumb, PtColumn, PtRow } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-catalog-page',
  imports: [SearchPageComponent],
  templateUrl: './catalog-page.component.html',
})
export class CatalogPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CatalogStore);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  protected readonly query = signal('');
  protected readonly kind = computed(() => String(this.data()['kind'] ?? 'lines'));
  protected readonly title = computed(() => this.kind() === 'calculators' ? 'Калькуляторы' : 'Линии бизнеса');
  protected readonly subtitle = computed(() => this.kind() === 'calculators'
    ? 'Тарифные калькуляторы, привязанные к версии продукта.'
    : 'Линии бизнеса, внутри которых собираются продукты.');

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Обзор', route: '/dashboard' },
    { label: this.title() },
  ]);

  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '120px' },
    { key: 'name', label: 'Название' },
    { key: 'note', label: 'Связь' },
    { key: 'updated', label: 'Обновлён', width: '140px' },
    { key: 'status', label: 'Статус', width: '150px', kind: 'status' },
  ];

  protected readonly rows = computed<PtRow[]>(() => {
    const source = this.kind() === 'calculators' ? this.store.calculators() : this.store.lines();
    const query = this.query().trim().toLowerCase();
    return source
      .filter((item) => !query || `${item.code} ${item.name} ${item.note}`.toLowerCase().includes(query))
      .map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        note: item.note,
        updated: item.updated,
        status: item.status,
      }));
  });
}
