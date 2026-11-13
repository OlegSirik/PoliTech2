import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface RefDict {
  code: string;
  name: string;
}

export interface RefDataItem {
  code: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class RefDictsService {
  private readonly http = inject(HttpClient);

  listDicts(): Observable<RefDict[]> {
    return this.http.get<RefDict[]>('/bff/refdicts');
  }

  createDict(dto: RefDict): Observable<RefDict> {
    return this.http.post<RefDict>('/bff/refdicts', dto);
  }

  updateDict(code: string, dto: RefDict): Observable<RefDict> {
    return this.http.put<RefDict>(`/bff/refdicts/${encodeURIComponent(code)}`, dto);
  }

  deleteDict(code: string): Observable<void> {
    return this.http.delete<void>(`/bff/refdicts/${encodeURIComponent(code)}`);
  }

  listItems(dictCode: string): Observable<RefDataItem[]> {
    return this.http.get<RefDataItem[]>(`/bff/refdicts/${encodeURIComponent(dictCode)}/items`);
  }

  createItem(dictCode: string, dto: RefDataItem): Observable<RefDataItem> {
    return this.http.post<RefDataItem>(`/bff/refdicts/${encodeURIComponent(dictCode)}/items`, dto);
  }

  updateItem(dictCode: string, itemCode: string, dto: RefDataItem): Observable<RefDataItem> {
    return this.http.put<RefDataItem>(
      `/bff/refdicts/${encodeURIComponent(dictCode)}/items/${encodeURIComponent(itemCode)}`,
      dto,
    );
  }

  deleteItem(dictCode: string, itemCode: string): Observable<void> {
    return this.http.delete<void>(
      `/bff/refdicts/${encodeURIComponent(dictCode)}/items/${encodeURIComponent(itemCode)}`,
    );
  }
}
