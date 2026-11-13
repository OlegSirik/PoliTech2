import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type RuleScopeType = 'PRODUCT' | 'LOB' | 'TENANT' | 'CLIENT';

export type RuleType =
  | 'PRE_QUOTE_VALIDATION'
  | 'POST_QUOTE_VALIDATION'
  | 'PRE_SAVE_VALIDATION'
  | 'UNDERWRITING';

export interface Rule {
  id?: number;
  code: string;
  name: string;
  scopeType: RuleScopeType;
  scopeCode: string;
  ruleType: RuleType;
  priority?: number;
  recordStatus?: string;
  expressionLanguage?: string;
  expression: string;
  message: string;
  llmText?: string;
}

export interface RuleListFilter {
  ruleType?: RuleType | '';
  scopeType?: RuleScopeType | '';
  scopeCode?: string;
  recordStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly http = inject(HttpClient);

  list(filter: RuleListFilter = {}): Observable<Rule[]> {
    let params = new HttpParams();
    if (filter.ruleType) {
      params = params.set('ruleType', filter.ruleType);
    }
    if (filter.scopeType) {
      params = params.set('scopeType', filter.scopeType);
    }
    if (filter.scopeCode) {
      params = params.set('scopeCode', filter.scopeCode);
    }
    if (filter.recordStatus) {
      params = params.set('recordStatus', filter.recordStatus);
    }
    return this.http.get<Rule[]>('/bff/rules', { params });
  }

  getById(id: number | string): Observable<Rule> {
    return this.http.get<Rule>(`/bff/rules/${id}`);
  }

  create(rule: Rule): Observable<Rule> {
    return this.http.post<Rule>('/bff/rules', rule);
  }

  update(id: number, rule: Rule): Observable<Rule> {
    return this.http.put<Rule>(`/bff/rules/${id}`, rule);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/bff/rules/${id}`);
  }

  reloadCache(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>('/bff/rules/cmd/reload', {});
  }
}
