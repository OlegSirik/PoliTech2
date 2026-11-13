import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductListItem {
  id?: number;
  code: string;
  name?: string;
  devVersionNo?: number | null;
  prodVersionNo?: number | null;
}

export interface LlmRuleDraft {
  code?: string;
  name?: string;
  condition?: string;
  message?: string;
}

export interface LlmAssistResponse {
  success: boolean;
  result?: LlmRuleDraft;
  warnings?: string[];
  errors?: string[];
}

export interface TenantLlmConfigView {
  enabled: boolean;
  configured: boolean;
}

@Injectable({ providedIn: 'root' })
export class RuleAssistService {
  private readonly http = inject(HttpClient);

  products(): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>('/bff/products');
  }

  llmConfig(): Observable<TenantLlmConfigView> {
    return this.http.get<TenantLlmConfigView>('/bff/tenant/llm-config');
  }

  assistProduct(productId: number, versionNo: number, userMessage: string): Observable<LlmAssistResponse> {
    return this.http.post<LlmAssistResponse>(
      `/bff/products/${productId}/versions/${versionNo}/llm/assist`,
      { taskType: 'RULE', userMessage, productId, versionNo },
    );
  }

  assistLob(lobCode: string, userMessage: string): Observable<LlmAssistResponse> {
    return this.http.post<LlmAssistResponse>(
      `/bff/lobs/${encodeURIComponent(lobCode)}/llm/assist`,
      { taskType: 'RULE', userMessage, lobCode },
    );
  }
}
