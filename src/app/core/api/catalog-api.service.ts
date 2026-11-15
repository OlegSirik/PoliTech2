import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CalculatorDocument,
  CalculatorTemplate,
  CoefficientDataRow,
  AddonPricelist,
  AddonProvider,
  InsuranceCompany,
  Partner,
  PartnerCommission,
  PartnerMember,
  PartnerProduct,
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

  assistProduct(productId: number, versionNo: number, userMessage: string, taskType: string): Observable<{ success?: boolean; result?: unknown; warnings?: string[]; errors?: string[] }> {
    return this.api.post(`admin/products/${productId}/versions/${versionNo}/llm/assist`, { taskType, userMessage, productId, versionNo });
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

  insuranceCompany(id: number): Observable<InsuranceCompany> {
    return this.api.get<InsuranceCompany>(`admin/insCompanies/${id}`);
  }

  createInsuranceCompany(body: InsuranceCompany): Observable<InsuranceCompany> {
    return this.api.post<InsuranceCompany>('admin/insCompanies', body);
  }

  updateInsuranceCompany(id: number, body: InsuranceCompany): Observable<InsuranceCompany> {
    return this.api.put<InsuranceCompany>(`admin/insCompanies/${id}`, body);
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

  addonProviders(): Observable<AddonProvider[]> {
    return this.api.get<AddonProvider[]>('admin/addon/providers');
  }

  addonProvider(id: number): Observable<AddonProvider> {
    return this.api.get<AddonProvider>(`admin/addon/providers/${id}`);
  }

  createAddonProvider(body: AddonProvider): Observable<AddonProvider> {
    return this.api.post<AddonProvider>('admin/addon/providers', body);
  }

  updateAddonProvider(id: number, body: AddonProvider): Observable<AddonProvider> {
    return this.api.put<AddonProvider>(`admin/addon/providers/${id}`, body);
  }

  suspendAddonProvider(id: number): Observable<void> {
    return this.api.delete<void>(`admin/addon/providers/${id}`);
  }

  addonPricelists(providerId?: number): Observable<AddonPricelist[]> {
    return this.api.get<AddonPricelist[]>('admin/addon/pricelists', { spId: providerId });
  }

  addonPricelist(id: number): Observable<AddonPricelist> {
    return this.api.get<AddonPricelist>(`admin/addon/pricelists/${id}`);
  }

  createAddonPricelist(body: AddonPricelist): Observable<AddonPricelist> {
    return this.api.post<AddonPricelist>('admin/addon/pricelists', body);
  }

  updateAddonPricelist(id: number, body: AddonPricelist): Observable<AddonPricelist> {
    return this.api.put<AddonPricelist>(`admin/addon/pricelists/${id}`, body);
  }

  deleteAddonPricelist(id: number): Observable<void> {
    return this.api.delete<void>(`admin/addon/pricelists/${id}`);
  }

  partners(): Observable<Partner[]> {
    return this.api.get<Partner[]>('admin/clients');
  }

  partner(id: number): Observable<Partner> {
    return this.api.get<Partner>(`admin/clients/${id}`);
  }

  createPartner(body: Partner): Observable<Partner> {
    return this.api.post<Partner>('admin/clients', body);
  }

  updatePartner(id: number, body: Partner): Observable<Partner> {
    return this.api.put<Partner>(`admin/clients/${id}`, body);
  }

  partnerProducts(id: number): Observable<PartnerProduct[]> {
    return this.api.get<PartnerProduct[]>(`admin/clients/${id}/products`);
  }

  grantPartnerProduct(id: number, body: PartnerProduct): Observable<PartnerProduct> {
    return this.api.post<PartnerProduct>(`admin/clients/${id}/products`, body);
  }

  revokePartnerProduct(id: number, grantId: number): Observable<void> {
    return this.api.delete<void>(`admin/clients/${id}/products/${grantId}`);
  }

  partnerMembers(id: number, role: string): Observable<PartnerMember[]> {
    return this.api.get<PartnerMember[]>(`admin/clients/${id}/members`, { role });
  }

  addPartnerMember(id: number, body: { role: string; userLogin: string }): Observable<PartnerMember> {
    return this.api.post<PartnerMember>(`admin/clients/${id}/members`, body);
  }

  deletePartnerMember(id: number, memberId: number): Observable<void> {
    return this.api.delete<void>(`admin/clients/${id}/members/${memberId}`);
  }

  partnerCommissions(accountId: number, productId: number): Observable<PartnerCommission[]> {
    return this.api.get<PartnerCommission[]>('admin/commissions/configurations', { accountId, productId });
  }

  partnerCommission(id: number): Observable<PartnerCommission> {
    return this.api.get<PartnerCommission>(`admin/commissions/configurations/${id}`);
  }

  createPartnerCommission(body: PartnerCommission): Observable<PartnerCommission> {
    return this.api.post<PartnerCommission>('admin/commissions/configurations', body);
  }

  updatePartnerCommission(id: number, body: PartnerCommission): Observable<PartnerCommission> {
    return this.api.put<PartnerCommission>(`admin/commissions/configurations/${id}`, body);
  }

  deletePartnerCommission(id: number): Observable<void> {
    return this.api.delete<void>(`admin/commissions/configurations/${id}`);
  }
}
