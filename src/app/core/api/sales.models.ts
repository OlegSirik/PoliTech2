export interface PolicyIndex {
  policyNumber?: string;
  versionNo?: number;
  productCode?: string;
  policyStatus?: string;
}

export interface PolicyDocument {
  policyId?: string;
  policyNumber?: string;
  policyStatus?: string;
  policyIndex?: PolicyIndex;
  policy?: string | Record<string, unknown>;
}

export interface Quote {
  id?: string;
  draftId?: string;
  policyNr?: string;
  productCode?: string;
  insCompany?: string;
  policyStatus?: string;
  phDigest?: string;
  ioDigest?: string;
  premium?: string | number;
  agentDigest?: string;
  agentKvPrecent?: string | number;
  agentKvAmount?: string | number;
  comand1?: boolean;
  comand2?: boolean;
  comand3?: boolean;
  comand4?: boolean;
  comand5?: boolean;
  comand6?: boolean;
  comand7?: boolean;
  comand8?: boolean;
  comand9?: boolean;
}
