export interface Breadcrumb {
  label: string;
  route?: string;
}

export interface PtColumn {
  key: string;
  label: string;
  width?: string;
  kind?: 'text' | 'status';
}

export interface PtRow {
  id: string;
  [key: string]: string;
}

export interface PtAction {
  id: string;
  label: string;
  icon?: string;
  tone?: 'primary' | 'accent' | 'ghost';
}

export interface PtRowAction {
  id: string;
  label: string;
  icon: string;
  tone?: 'default' | 'danger';
}

export interface PtRowActionEvent {
  id: string;
  row: PtRow;
}

export function statusClass(value: string): string {
  if (value === 'Опубликован') {
    return 'is-published';
  }
  if (value === 'Архив') {
    return 'is-archived';
  }
  return 'is-draft';
}
