import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CalculatorDocument,
  CalculatorTemplate,
  CoefficientDataRow,
  InsuranceCompany,
  LobDocument,
  LobSummary,
  PolicyForm,
  PolicyVar,
  ProductSummary,
  ProductVersion,
} from './catalog.models';
import { UpstreamService } from './upstream.service';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly api = inject(UpstreamService);

  lobs(): Observable<LobSummary[]> {
    return this.api.get<LobSummary[]>('admin/lobs');
  }

  lob(id: string | number): Observable<LobDocument> {
    return this.api.get<LobDocument>(`admin/lobs/${encodeURIComponent(String(id))}`);
  }

  createLob(body: LobDocument): Observable<LobDocument> {
    return this.api.post<LobDocument>('admin/lobs', body);
  }

  updateLob(id: number, body: LobDocument): Observable<LobDocument> {
    return this.api.put<LobDocument>(`admin/lobs/${id}`, body);
  }

  deleteLob(id: number): Observable<void> {
    return this.api.delete<void>(`admin/lobs/${id}`);
  }

  lobExample(code: string): Observable<string> {
    return this.api.getText(`admin/lobs/${encodeURIComponent(code)}/example`);
  }

  assistLob(code: string, userMessage: string, taskType: string): Observable<{ success: boolean; result?: unknown; warnings?: string[]; errors?: string[] }> {
    return this.api.post(`admin/lobs/${encodeURIComponent(code)}/llm/assist`, { taskType, userMessage, lobCode: code });
  }

  products(insComp?: number | null): Observable<ProductSummary[]> {
    return this.api.get<ProductSummary[]>('admin/products', { insComp });
  }

  product(id: number, versionNo: number): Observable<ProductVersion> {
    return this.api.get<ProductVersion>(`admin/products/${id}/versions/${versionNo}`);
  }

  createProduct(body: ProductVersion): Observable<ProductVersion> {
    return this.api.post<ProductVersion>('admin/products', body);
  }

  updateProduct(id: number, versionNo: number, body: ProductVersion): Observable<ProductVersion> {
    return this.api.put<ProductVersion>(`admin/products/${id}/versions/${versionNo}`, body);
  }

  updateProductVar(id: number, versionNo: number, varCode: string, body: PolicyVar): Observable<ProductVersion> {
    return this.api.put<ProductVersion>(
      `admin/products/${id}/versions/${versionNo}/vars/${encodeURIComponent(varCode)}`,
      body,
    );
  }

  deleteProductVar(id: number, versionNo: number, varCode: string): Observable<ProductVersion> {
    return this.api.delete<ProductVersion>(
      `admin/products/${id}/versions/${versionNo}/vars/${encodeURIComponent(varCode)}`,
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`admin/products/${id}`);
  }

  deleteProductVersion(id: number, versionNo: number): Observable<void> {
    return this.api.delete<void>(`admin/products/${id}/versions/${versionNo}`);
  }

  publishProduct(id: number, versionNo: number): Observable<ProductVersion> {
    return this.api.post<ProductVersion>(`admin/products/${id}/versions/${versionNo}/cmd/publish`, {});
  }

  createProductVersion(id: number, versionNo: number): Observable<ProductVersion> {
    return this.api.post<ProductVersion>(`admin/products/${id}/versions/${versionNo}/cmd/create`, {});
  }

  exampleQuote(id: number, versionNo: number): Observable<string> {
    return this.api.getText(`admin/products/${id}/versions/${versionNo}/example_quote`);
  }

  exampleSave(id: number, versionNo: number): Observable<string> {
    return this.api.getText(`admin/products/${id}/versions/${versionNo}/example_save`);
  }

  testRequest(id: number, versionNo: number, kind: 'quote' | 'policy'): Observable<string> {
    return this.api.getText(`admin/text/${kind}/${id}/${versionNo}`);
  }

  saveTestRequest(id: number, versionNo: number, kind: 'quote' | 'policy', body: unknown): Observable<string> {
    return this.api.postText(`admin/text/${kind}/${id}/${versionNo}`, body);
  }

  executeTestRequest(kind: 'quote' | 'policy', body: unknown): Observable<string> {
    const path = kind === 'quote' ? 'sales/quotes' : 'sales/policies';
    return this.api.postText(path, body);
  }

  documentation(id: number, versionNo: number): Observable<{ markdown?: string }> {
    return this.api.get(`admin/products/${id}/versions/${versionNo}/documentation`);
  }

  insuranceCompanies(): Observable<InsuranceCompany[]> {
    return this.api.get<InsuranceCompany[]>('admin/insCompanies');
  }

  policyForms(): Observable<PolicyForm[]> {
    return this.api.get<PolicyForm[]>('admin/policy-forms');
  }

  calculator(productId: string | number, versionNo: string | number, packageNo: string): Observable<CalculatorDocument> {
    return this.api.get(`admin/calculators/products/${productId}/versions/${versionNo}/packages/${encodeURIComponent(packageNo)}`);
  }

  createCalculator(productId: string | number, versionNo: string | number, packageNo: string, templateId?: number | null): Observable<CalculatorDocument> {
    return this.api.post(`admin/calculators/products/${productId}/versions/${versionNo}/packages/${encodeURIComponent(packageNo)}`, {
      productId: String(productId),
      versionNo: String(versionNo),
      packageNo,
      templateId: templateId ?? null,
    });
  }

  updateCalculator(calculator: CalculatorDocument): Observable<CalculatorDocument> {
    return this.api.put(
      `admin/calculators/products/${calculator.productId}/versions/${calculator.versionNo}/packages/${encodeURIComponent(calculator.packageNo)}`,
      calculator,
    );
  }

  assistCalculator(productId: string | number, versionNo: string | number, packageNo: string, userMessage: string): Observable<{ success?: boolean; calculator?: CalculatorDocument; message?: string }> {
    return this.api.post(
      `admin/calculators/products/${productId}/versions/${versionNo}/packages/${encodeURIComponent(packageNo)}/llm/assist`,
      { taskType: 'CALCULATOR', userMessage, productId, versionNo, packageNo },
    );
  }

  templates(lob: string): Observable<CalculatorTemplate[]> {
    return this.api.get<CalculatorTemplate[]>('admin/calculators/templates', { lob });
  }

  createTemplate(lobCode: string, calculatorId: number): Observable<CalculatorTemplate> {
    return this.api.post('admin/calculators/templates', { lobCode, calculatorId });
  }

  renameTemplate(id: number, templateName: string): Observable<CalculatorTemplate> {
    return this.api.put(`admin/calculators/templates/${id}`, { templateName });
  }

  deleteTemplate(id: number): Observable<void> {
    return this.api.delete(`admin/calculators/templates/${id}`);
  }

  coefficientData(calculatorId: string | number, code: string): Observable<CoefficientDataRow[]> {
    return this.api.get(`admin/calculators/${calculatorId}/coefficients/${encodeURIComponent(code)}`);
  }

  saveCoefficientData(calculatorId: string | number, code: string, rows: CoefficientDataRow[]): Observable<CoefficientDataRow[]> {
    return this.api.put(`admin/calculators/${calculatorId}/coefficients/${encodeURIComponent(code)}`, rows);
  }

  coefficientSql(calculatorId: string | number, code: string): Observable<string> {
    return this.api.getText(`admin/calculators/${calculatorId}/coefficients/${encodeURIComponent(code)}/SQL`);
  }
}
