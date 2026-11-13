export interface Product {
  id: string;
  code: string;
  name: string;
  line: string;
  version: string;
  status: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  description: string;
}

export interface CatalogRecord {
  id: string;
  code: string;
  name: string;
  status: string;
  updated: string;
  note: string;
}

export const PRODUCT_STATUSES = ['Черновик', 'Опубликован', 'Архив'] as const;
export const CURRENCIES = ['RUB', 'USD', 'EUR'] as const;

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'acc',
    code: 'ACC',
    name: 'НС Классика',
    line: 'Несчастный случай',
    version: '3',
    status: 'Опубликован',
    currency: 'RUB',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    description: 'Базовый продукт страхования от несчастного случая. Пакеты, покрытия и калькулятор ведутся отдельно.',
  },
  {
    id: 'gad',
    code: 'GAD',
    name: 'Комплексная защита',
    line: 'Имущество',
    version: '12',
    status: 'Черновик',
    currency: 'RUB',
    effectiveFrom: '2026-03-01',
    effectiveTo: '',
    description: 'Имущественный продукт. Версия 12 ещё не опубликована.',
  },
  {
    id: 'crg',
    code: 'CRG',
    name: 'Грузы',
    line: 'Грузы',
    version: '1',
    status: 'Опубликован',
    currency: 'USD',
    effectiveFrom: '2025-06-01',
    effectiveTo: '2027-05-31',
    description: 'Страхование грузов. Тариф считается калькулятором CRG 1.0.',
  },
  {
    id: 'pax',
    code: 'PAX',
    name: 'Пассажиры',
    line: 'Несчастный случай',
    version: '2',
    status: 'Архив',
    currency: 'RUB',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2025-12-31',
    description: 'Архивная версия продукта для пассажиров.',
  },
];

export const SEED_LINES: CatalogRecord[] = [
  { id: 'acc', code: 'ACC', name: 'Несчастный случай', status: 'Опубликован', updated: '12.11.2026', note: '4 продукта' },
  { id: 'gad', code: 'GAD', name: 'Имущество', status: 'Черновик', updated: '02.11.2026', note: '1 продукт' },
  { id: 'crg', code: 'CRG', name: 'Грузы', status: 'Опубликован', updated: '18.10.2026', note: '1 продукт' },
  { id: 'pax', code: 'PAX', name: 'Пассажиры', status: 'Архив', updated: '01.09.2026', note: '1 продукт' },
];

export const SEED_CALCULATORS: CatalogRecord[] = [
  { id: 'hc-5', code: 'HC_5', name: 'НС Классика 5', status: 'Опубликован', updated: '12.11.2026', note: 'ACC · пакет 5' },
  { id: 'gad-12', code: 'GAD_1_12', name: 'Комплексная защита 1.12', status: 'Черновик', updated: '02.11.2026', note: 'GAD · версия 12' },
  { id: 'crg-1', code: 'CRG_1_0', name: 'Грузы 1.0', status: 'Опубликован', updated: '18.10.2026', note: 'CRG · версия 1' },
];
