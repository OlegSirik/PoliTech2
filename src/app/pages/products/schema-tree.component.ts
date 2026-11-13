import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PolicyVar } from '../../core/api/catalog.models';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';

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
  selector: 'pt-schema-tree',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, ActionButtonComponent],
  templateUrl: './schema-tree.component.html',
  styleUrl: './schema-tree.component.scss',
})
export class SchemaTreeComponent {
  readonly vars = input<PolicyVar[]>([]);
  readonly locked = input(false);
  /** `policy` оставляет корнем только узел договора. `null` показывает все узлы без родителя. */
  readonly rootCode = input<string | null>('policy');
  /** У схемы продукта есть тариф и обязательность. У линии бизнеса только правка и скрытие. */
  readonly actions = input<'product' | 'line'>('product');

  readonly edit = output<PolicyVar>();
  readonly remove = output<PolicyVar>();
  readonly restore = output<PolicyVar>();
  readonly flag = output<{ variable: PolicyVar; field: 'isOptional' | 'isTarifFactor' }>();

  protected readonly showDeleted = signal(false);
  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  private readonly nodes = computed(() => this.toNodes(this.vars()));
  protected readonly rows = computed(() => this.flatten(this.nodes(), this.showDeleted(), this.expanded()));

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
    const ids = this.nodes()
      .filter((node) => this.childCount(this.nodes(), node.id, this.showDeleted()) > 0)
      .map((node) => node.id);
    this.expanded.set(new Set(ids));
  }

  protected collapseAll(): void {
    this.expanded.set(new Set());
  }

  protected isObject(variable: PolicyVar): boolean {
    return (variable.varType ?? '').trim().toUpperCase() === 'OBJECT';
  }

  private toNodes(vars: PolicyVar[]): SchemaNode[] {
    const used = new Set<number>();
    const rootCode = this.rootCode();
    const visible = rootCode == null
      ? vars
      : vars.filter((item) => !(item.parent_id == null && item.varCode !== rootCode));
    return visible.map((source, index) => {
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

  private flatten(nodes: SchemaNode[], showDeleted: boolean, expanded: ReadonlySet<number>): FlatNode[] {
    const kept = nodes.filter((node) => showDeleted || !node.source.isDeleted);
    const ids = new Set(kept.map((node) => node.id));
    const children = new Map<string, SchemaNode[]>();
    for (const node of kept) {
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

  private childCount(nodes: SchemaNode[], id: number, showDeleted: boolean): number {
    return nodes.filter((node) => node.parentId === id && (showDeleted || !node.source.isDeleted)).length;
  }
}
