import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UpstreamService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: Record<string, string | number | null | undefined>): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.params(query) });
  }

  getText(path: string): Observable<string> {
    return this.http.get(this.url(path), { responseType: 'text' });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? {});
  }

  postText(path: string, body: unknown): Observable<string> {
    return this.http.post(this.url(path), body ?? {}, { responseType: 'text' });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? {});
  }

  delete<T>(path: string, body?: unknown): Observable<T> {
    return this.http.request<T>('DELETE', this.url(path), { body });
  }

  private url(path: string): string {
    return `/bff/upstream/${path.replace(/^\/+/, '')}`;
  }

  private params(query?: Record<string, string | number | null | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value != null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
