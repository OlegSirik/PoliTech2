import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PolicyDocument, Quote } from './sales.models';
import { UpstreamService } from './upstream.service';

@Injectable({ providedIn: 'root' })
export class SalesApiService {
  private readonly api = inject(UpstreamService);

  policy(policyNr: string): Observable<PolicyDocument> {
    return this.api.get<PolicyDocument>(`sales/${encodeURIComponent(policyNr)}`);
  }

  quotes(qstr?: string): Observable<Quote[]> {
    return this.api.get<Quote[]>('sales/quotes', { qstr });
  }

  printForm(policyNr: string, pfType: string): Observable<Blob> {
    const path = `sales/policies/${encodeURIComponent(policyNr)}/printpf/${encodeURIComponent(pfType)}`;
    return this.api.getBlob(path);
  }
}
