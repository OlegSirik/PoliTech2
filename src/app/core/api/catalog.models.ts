export interface LobSummary {
  id: number;
  mpCode: string;
  mpName: string;
}

export interface LobVar {
  id?: number;
  parent_id?: number;
  varCode: string;
  varType: string;
  varPath: string;
  varName: string;
  varDataType: string;
  varValue: string;
  varNr: number;
  varList?: string;
  isSystem?: boolean;
  isDeleted?: boolean;
}

export interface LobCover {
  coverCode: string;
  coverName: string;
  risks: string;
}

export interface LobFile {
  fileCode: string;
  fileName: string;
}

export interface LobCoefficientColumn {
  varCode: string;
  varDataType: string;
  nr: string;
  conditionOperator: string;
  sortOrder: string;
}

export interface LobCoefficient {
  varCode: string;
  varName: string;
  altVarCode: string;
  altVarValue?: string | number | null;
  errorTextIfNotFound?: string;
  columns: LobCoefficientColumn[];
}

export interface LobDocument {
  id?: number;
  mpCode: string;
  mpName: string;
  mpPhType?: string;
  mpInsObjectType?: string;
  mpVars: LobVar[];
  mpCovers: LobCover[];
  mpFiles: LobFile[];
  mpCoefficients: LobCoefficient[];
}

export interface ProductSummary {
  id?: number;
  lob: string;
  code: string;
  name: string;
  prodVersionNo?: number | null;
  devVersionNo?: number | null;
}

export interface InsuranceCompany {
  id?: number;
  tid?: number;
  code?: string;
  name?: string;
  status?: string;
  shortName?: string;
  fullName?: string;
  egr?: string;
  postalAddress?: string;
  legalAddress?: string;
  phone?: string;
  mail?: string;
  inn?: string;
  kpp?: string;
  okpo?: string;
  ogrn?: string;
  account?: string;
  bank?: string;
  bic?: string;
  corrAccount?: string;
  contractText?: string;
  contractRepresentative?: string;
}

export interface PartnerConfiguration {
  paymentGate?: string;
  sendEmailAfterBuy?: boolean;
  sendSmsAfterBuy?: boolean;
  paymentGateAgentNumber?: string;
  paymentGateLogin?: string;
  paymentGatePassword?: string;
  employeeEmail?: string;
}

export interface Partner {
  id?: number;
  tid?: number;
  authClientId: string;
  name: string;
  recordStatus: string;
  defaultAccountId?: number;
  clientAccountId?: number;
  authType?: string | null;
  authLevel: string;
  clientConfiguration?: PartnerConfiguration;
  isDeleted?: boolean;
}

export interface PartnerProduct {
  id?: number;
  accountId?: number;
  lobCode?: string;
  roleProductId: number;
  roleProductName?: string;
  productCode?: string;
  productName?: string;
  isDeleted?: boolean;
}

export interface PartnerMember {
  id: number;
  userLogin: string;
  fullName?: string;
  position?: string;
  userRole?: string;
  accountId?: number;
}

export interface PartnerCommission {
  id?: number;
  accountId: number;
  productId: number;
  action: string;
  rateValue?: number | null;
  fixedAmount?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  commissionMinRate?: number | null;
  commissionMaxRate?: number | null;
  agdNumber?: string;
}

export interface AddonProvider {
  id?: number;
  name: string;
  recordStatus: string;
  executionMode?: string;
}

export interface AddonProductRef {
  productId: number;
  preconditions?: string;
}

export interface AddonPricelist {
  id?: number;
  providerId: number;
  code: string;
  name: string;
  categoryCode?: string;
  price?: number | null;
  amountFree?: number | null;
  amountBooked?: number | null;
  recordStatus: string;
  addonProducts?: AddonProductRef[];
}

export interface PolicyForm {
  id?: number;
  pageId: string;
  title?: string;
}

export interface QuoteValidator {
  lineNr?: number;
  keyLeft: string;
  ruleType: string;
  keyRight?: string;
  valueRight?: string;
  dataType: string;
  errorText: string;
  isUpdatable?: boolean;
  validatorType?: string;
}

export interface PolicyVar {
  id?: number;
  parent_id?: number | null;
  varPath: string;
  varName: string;
  varCode: string;
  varDataType: string;
  varValue: string;
  varType: string;
  varCdm?: string;
  varList?: string;
  varNr: number;
  name?: string;
  isSystem?: boolean;
  isTarifFactor?: boolean;
  isOptional?: boolean;
  isDeleted?: boolean;
}

export interface Deductible {
  id?: number;
  text: string;
}

export interface CoverLimit {
  nr?: number;
  sumInsured: number;
  premium: number;
}

export interface ProductCover {
  code: string;
  isMandatory: boolean;
  waitingPeriod: string;
  coverageTerm: string;
  isDeductibleMandatory: boolean;
  deductibles: Deductible[];
  limits: CoverLimit[];
}

export interface PackageFile {
  fileCode: string;
  fileName: string;
  fileNr?: number;
  isStatic?: boolean;
}

export interface ProductPackage {
  id?: number;
  code: string;
  name: string;
  covers: ProductCover[];
  files: PackageFile[];
  calculatorId?: number | null;
}

export interface ProductCelRule {
  id?: number;
  code?: string;
  name?: string;
  ruleType?: string;
  priority?: number;
  llmText?: string;
  message?: string;
  expression?: string;
  scopeType?: string;
}

export interface ProductVersion {
  id?: number;
  lob: string;
  code: string;
  name: string;
  insCompanyId?: number | null;
  versionNo: number;
  versionStatus?: string;
  policyFormPageId?: string | null;
  waitingPeriod: { validatorType?: string; validatorValue?: string };
  policyTerm: { validatorType?: string; validatorValue?: string };
  numberGenerator: { mask: string; maxValue: number; resetPolicy: string; xorMask: string };
  quoteValidator: QuoteValidator[];
  saveValidator: QuoteValidator[];
  packages: ProductPackage[];
  vars: PolicyVar[];
  rules: { insuredEqualsPolicyHolder: boolean };
  celRules?: ProductCelRule[];
}

export interface CalculatorVar {
  varCode: string;
  varName: string;
  varKind?: string;
  varDataType: string;
  varValue?: string;
}

export interface FormulaLine {
  nr: string;
  conditionLeft: string;
  conditionOperator: string;
  conditionRight: string;
  expressionResult: string;
  expressionLeft: string;
  expressionOperator: string;
  expressionRight: string;
  postProcessor?: string;
}

export interface CalculatorFormula {
  varCode: string;
  varName: string;
  lines: FormulaLine[];
}

export interface CalculatorColumn {
  varCode: string;
  varDataType: string;
  nr: string;
  conditionOperator: string;
  sortOrder: string;
}

export interface CalculatorCoefficient {
  varCode: string;
  varName: string;
  altVarCode?: string;
  altVarValue?: string | number | null;
  errorTextIfNotFound?: string;
  columns: CalculatorColumn[];
}

export interface CoefficientDataRow {
  id?: number;
  conditionValue: (string | null)[];
  resultValue: number;
}

export interface CalculatorDocument {
  id?: string | number;
  productId: string;
  productCode: string;
  versionNo: string;
  packageNo: string;
  llmText?: string;
  vars: CalculatorVar[];
  formulas: CalculatorFormula[];
  coefficients: CalculatorCoefficient[];
}

export interface CalculatorTemplate {
  calculatorId?: number;
  calculatorName?: string;
  lines?: { lineNr?: number; text?: string }[];
}

export function emptyLob(): LobDocument {
  return { mpCode: '', mpName: '', mpPhType: '', mpInsObjectType: '', mpVars: [], mpCovers: [], mpFiles: [], mpCoefficients: [] };
}

export function normalizeLob(value: LobDocument): LobDocument {
  return {
    ...emptyLob(),
    ...value,
    mpVars: value.mpVars ?? [],
    mpCovers: value.mpCovers ?? [],
    mpFiles: value.mpFiles ?? [],
    mpCoefficients: (value.mpCoefficients ?? []).map((item) => ({ ...item, columns: item.columns ?? [] })),
  };
}

export function emptyProduct(partial: Partial<ProductVersion> = {}): ProductVersion {
  return {
    lob: '',
    code: '',
    name: '',
    versionNo: 1,
    waitingPeriod: {},
    policyTerm: {},
    numberGenerator: { mask: '', maxValue: 0, resetPolicy: 'MONTHLY', xorMask: '' },
    quoteValidator: [],
    saveValidator: [],
    packages: [],
    vars: [],
    rules: { insuredEqualsPolicyHolder: false },
    ...partial,
  };
}

export function normalizeProduct(value: ProductVersion): ProductVersion {
  const base = emptyProduct(value);
  return {
    ...base,
    insCompanyId: value.insCompanyId ?? null,
    policyFormPageId: value.policyFormPageId ?? null,
    waitingPeriod: value.waitingPeriod ?? {},
    policyTerm: value.policyTerm ?? {},
    numberGenerator: { ...base.numberGenerator, ...(value.numberGenerator ?? {}) },
    quoteValidator: value.quoteValidator ?? [],
    saveValidator: value.saveValidator ?? [],
    packages: (value.packages ?? []).map((item) => ({
      ...item,
      covers: (item.covers ?? []).map((cover) => ({
        ...cover,
        deductibles: cover.deductibles ?? [],
        limits: cover.limits ?? [],
      })),
      files: item.files ?? [],
    })),
    vars: value.vars ?? [],
    rules: { insuredEqualsPolicyHolder: !!value.rules?.insuredEqualsPolicyHolder },
    celRules: value.celRules ?? [],
  };
}

export function emptyCalculator(productId: string, versionNo: string, packageNo: string): CalculatorDocument {
  return {
    productId,
    productCode: '',
    versionNo,
    packageNo,
    llmText: '',
    vars: [],
    formulas: [],
    coefficients: [],
  };
}

export function normalizeCalculator(value: CalculatorDocument): CalculatorDocument {
  return {
    ...value,
    vars: value.vars ?? [],
    formulas: (value.formulas ?? []).map((item) => ({ ...item, lines: item.lines ?? [] })),
    coefficients: (value.coefficients ?? []).map((item) => ({ ...item, columns: item.columns ?? [] })),
  };
}

export function workingVersion(product: ProductSummary): number {
  if (product.devVersionNo != null) {
    return product.devVersionNo;
  }
  if (product.prodVersionNo != null) {
    return product.prodVersionNo;
  }
  return 0;
}
