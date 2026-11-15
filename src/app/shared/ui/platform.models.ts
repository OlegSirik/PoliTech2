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
  const normalized = value.trim().toLowerCase();
  if (normalized === 'опубликован') {
    return 'is-published';
  }
  if (normalized === 'архив' || normalized === 'deleted') {
    return 'is-archived';
  }
  if (normalized === 'черновик') {
    return 'is-draft';
  }
  if (normalized === 'active') {
    return 'is-active';
  }
  if (normalized === 'suspended') {
    return 'is-suspended';
  }
  return '';
}
