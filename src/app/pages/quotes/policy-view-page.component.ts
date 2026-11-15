import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, map, of, switchMap } from 'rxjs';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { PolicyVar } from '../../core/api/catalog.models';
import { SalesApiService } from '../../core/api/sales-api.service';
import { PolicyDocument } from '../../core/api/sales.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { formatPolicyValue, readPolicyPath } from './policy-json-path';

interface SchemaNode {
  id: number;
  parentId: number | null;
  varNr: number;
  source: PolicyVar;
}

interface FlatNode {
  node: SchemaNode;
  level: number;
  expandable: boolean;
  expanded: boolean;
}

@Component({
  selector: 'pt-policy-view-page',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, PageHeaderComponent],
  templateUrl: './policy-view-page.component.html',
  styleUrls: ['../catalog/sheet.scss', './policy-view-page.component.scss'],
})
export class PolicyViewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sales = inject(SalesApiService);
  private readonly catalog = inject(CatalogApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly policyNr = signal('');
  protected readonly productTitle = signal('');
  protected readonly document = signal<unknown>(null);
  private readonly vars = signal<PolicyVar[]>([]);
  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  private readonly nodes = computed(() => this.toNodes(this.withPath(this.vars())));
  protected readonly rows = computed(() => this.flatten(this.nodes(), this.expanded()));

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const policyNr = decodeURIComponent(params.get('policyNr') ?? '').trim();
        this.policyNr.set(policyNr);
        this.loading.set(true);
        if (!policyNr) {
          return of(null);
        }
        return this.sales.policy(policyNr).pipe(
          switchMap((policy) => this.loadProduct(policy)),
          catchError((error: unknown) => {
            this.snack.open(bffErrorMessage(error, 'Не удалось загрузить договор'), 'Закрыть', { duration: 4000 });
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((loaded) => {
      this.document.set(loaded?.document ?? null);
      this.vars.set(loaded?.vars ?? []);
      this.productTitle.set(loaded?.title ?? '');
      this.expanded.set(new Set());
      this.loading.set(false);
    });
  }

  protected value(variable: PolicyVar): string {
    return formatPolicyValue(readPolicyPath(this.document(), variable.varPath));
  }

  protected toggle(row: FlatNode): void {
    if (!row.expandable) {
      return;
    }
    const next = new Set(this.expanded());
    if (next.has(row.node.id)) {
      next.delete(row.node.id);
    } else {
      next.add(row.node.id);
    }
    this.expanded.set(next);
  }

  protected expandAll(): void {
    this.expanded.set(new Set(this.nodes().filter((node) => this.childCount(node.id) > 0).map((node) => node.id)));
  }

  protected collapseAll(): void {
    this.expanded.set(new Set());
  }

  private loadProduct(policy: PolicyDocument) {
    const document = parsePolicy(policy.policy);
    const code = textField(document, 'productCode') || policy.policyIndex?.productCode || '';
    const versionNo = numberField(document, 'productVersion')
      ?? policy.policyIndex?.versionNo
      ?? numberField(document, 'versionNo');
    const productName = textField(document, 'productName');
    if (!code || versionNo == null) {
      this.snack.open('В договоре нет кода продукта или версии', 'Закрыть', { duration: 4000 });
      return of({ document, vars: [] as PolicyVar[], title: productName });
    }
    return this.catalog.products().pipe(
      switchMap((list) => {
        const found = (list ?? []).find((item) => item.code === code)
          ?? (list ?? []).find((item) => item.code.toLowerCase() === code.toLowerCase());
        if (found?.id == null) {
          this.snack.open(`Продукт ${code} не найден`, 'Закрыть', { duration: 4000 });
          return of({ document, vars: [] as PolicyVar[], title: productName || code });
        }
        return this.catalog.product(found.id, versionNo).pipe(
          map((version) => ({
            document,
            vars: version.vars ?? [],
            title: `${version.name || found.name || code} · версия ${version.versionNo ?? versionNo}`,
          })),
        );
      }),
    );
  }

  private withPath(vars: PolicyVar[]): PolicyVar[] {
    const alive = vars.filter((item) => !item.isDeleted);
    const byId = new Map<number, PolicyVar>();
    for (const item of alive) {
      if (item.id != null) {
        byId.set(item.id, item);
      }
    }
    const kept = alive.filter((item) => hasPath(item));
    const keptIds = new Set(kept.map((item) => item.id).filter((id): id is number => id != null));
    return kept.map((item) => ({ ...item, parent_id: nearestKeptParent(item.parent_id, byId, keptIds) }));
  }

  private toNodes(vars: PolicyVar[]): SchemaNode[] {
    const used = new Set<number>();
    return vars.map((source, index) => {
      let id = source.id != null ? Number(source.id) : Number.NaN;
      if (!Number.isFinite(id) || used.has(id)) {
        id = 1_000_000 + index;
      }
      used.add(id);
      const parent = source.parent_id == null ? Number.NaN : Number(source.parent_id);
      const varNr = Number(source.varNr);
      return {
        id,
        parentId: Number.isFinite(parent) ? parent : null,
        varNr: Number.isFinite(varNr) ? varNr : 0,
        source,
      };
    });
  }

  private flatten(nodes: SchemaNode[], expanded: ReadonlySet<number>): FlatNode[] {
    const ids = new Set(nodes.map((node) => node.id));
    const children = new Map<string, SchemaNode[]>();
    for (const node of nodes) {
      const key = node.parentId != null && ids.has(node.parentId) ? String(node.parentId) : '__root__';
      const list = children.get(key) ?? [];
      list.push(node);
      children.set(key, list);
    }
    for (const list of children.values()) {
      list.sort((a, b) => a.varNr - b.varNr || a.id - b.id);
    }
    const out: FlatNode[] = [];
    const walk = (key: string, level: number) => {
      for (const node of children.get(key) ?? []) {
        const nested = children.get(String(node.id)) ?? [];
        const expandable = nested.length > 0;
        const open = expanded.has(node.id);
        out.push({ node, level, expandable, expanded: open });
        if (expandable && open) {
          walk(String(node.id), level + 1);
        }
      }
    };
    walk('__root__', 0);
    return out;
  }

  private childCount(id: number): number {
    return this.nodes().filter((node) => node.parentId === id).length;
  }
}

function hasPath(variable: PolicyVar): boolean {
  const path = (variable.varPath ?? '').trim();
  return path.length > 0 && path !== 'null' && path !== '*';
}

function nearestKeptParent(
  parentId: number | null | undefined,
  byId: Map<number, PolicyVar>,
  keptIds: Set<number>,
): number | null {
  let parent = parentId ?? null;
  const seen = new Set<number>();
  while (parent != null && !keptIds.has(parent)) {
    if (seen.has(parent)) {
      return null;
    }
    seen.add(parent);
    parent = byId.get(parent)?.parent_id ?? null;
  }
  return parent;
}

function parsePolicy(value: PolicyDocument['policy']): unknown {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value;
}

function textField(document: unknown, key: string): string {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return '';
  }
  const value = (document as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

function numberField(document: unknown, key: string): number | null {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return null;
  }
  const value = (document as Record<string, unknown>)[key];
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}
