import { Injectable, inject } from '@angular/core';
import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';
import { TenantContext } from './tenant-context';

const APP_ROOTS = new Set([
  'login',
  'dashboard',
  'products',
  'ins-companies',
  'addons',
  'business-lines',
  'calculators',
  'partners',
  'quotes',
  'rules',
  'refdicts',
  'bff',
]);

@Injectable()
export class TenantUrlSerializer implements UrlSerializer {
  private readonly inner = new DefaultUrlSerializer();
  private readonly tenant = inject(TenantContext);

  parse(url: string): UrlTree {
    const hashAt = url.indexOf('#');
    const hash = hashAt >= 0 ? url.slice(hashAt) : '';
    const withoutHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
    const queryAt = withoutHash.indexOf('?');
    const path = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
    const search = queryAt >= 0 ? withoutHash.slice(queryAt) : '';
    const segments = path.split('/').filter((part) => part.length > 0);

    if (segments.length > 0 && !APP_ROOTS.has(decodeURIComponent(segments[0]).toLowerCase())) {
      this.tenant.set(decodeURIComponent(segments[0]));
      const rest = segments.length === 1 ? '/' : `/${segments.slice(1).join('/')}`;
      return this.inner.parse(rest + search + hash);
    }
    return this.inner.parse(url);
  }

  serialize(tree: UrlTree): string {
    const raw = this.inner.serialize(tree);
    const code = this.tenant.code().trim();
    if (!code) {
      return raw;
    }
    const prefix = `/${encodeURIComponent(code)}`;
    if (raw === '' || raw === '/') {
      return prefix;
    }
    return raw.startsWith('/') ? prefix + raw : `${prefix}/${raw}`;
  }
}
