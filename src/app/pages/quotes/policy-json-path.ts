/** Читает значение договора по пути схемы: точки, индексы, фильтр isPrimary, [*] и sum()/count(). */
export function readPolicyPath(root: unknown, path: string): unknown {
  const expression = path.trim().replace(/^\$\.?/, '');
  if (!expression || expression === '*' || expression === 'null') {
    return undefined;
  }
  return step(root, expression.startsWith('[') ? expression : `.${expression}`);
}

export function formatPolicyValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '—';
    }
    if (value.every((item) => item == null || typeof item !== 'object')) {
      const text = value.filter((item) => item != null && item !== '').map((item) => String(item)).join(', ');
      return text || '—';
    }
    return '';
  }
  return '';
}

function step(value: unknown, rest: string): unknown {
  if (!rest || rest === '.') {
    return value;
  }
  if (rest.startsWith('.')) {
    rest = rest.slice(1);
  }
  if (rest === 'sum()') {
    return sum(value);
  }
  if (rest === 'count()') {
    return Array.isArray(value) ? value.length : value == null ? 0 : 1;
  }
  if (rest.startsWith('[')) {
    const index = /^\[(\d+)\](.*)$/.exec(rest);
    if (index) {
      const list = Array.isArray(value) ? value : [];
      return step(list[Number(index[1])], index[2]);
    }
    const filter = /^\[\?\(@\.([A-Za-z0-9_]+)\)\](.*)$/.exec(rest);
    if (filter && Array.isArray(value)) {
      const found = value.find((item) => isRecord(item) && truthy(item[filter[1]]));
      return step(found, filter[2]);
    }
    const star = /^\[\*\](.*)$/.exec(rest);
    if (star && Array.isArray(value)) {
      return step(value, star[1]);
    }
    return undefined;
  }
  const token = /^([^.[(]+)(.*)$/.exec(rest);
  if (!token) {
    return undefined;
  }
  const key = token[1];
  const tail = token[2];
  if (Array.isArray(value)) {
    return step(value.map((item) => (isRecord(item) ? item[key] : undefined)), tail);
  }
  if (!isRecord(value)) {
    return undefined;
  }
  return step(value[key], tail);
}

function sum(value: unknown): number {
  const list = Array.isArray(value) ? value : [value];
  return list.reduce<number>((total, item) => total + (typeof item === 'number' ? item : Number(item) || 0), 0);
}

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
