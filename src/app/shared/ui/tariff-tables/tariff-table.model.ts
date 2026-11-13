export interface TariffColumn {
  varCode: string;
  varDataType: string;
  nr: string;
  conditionOperator: string;
  sortOrder: string;
}

export interface TariffTable {
  varCode: string;
  varName: string;
  altVarCode?: string;
  altVarValue?: string | number | null;
  errorTextIfNotFound?: string;
  columns: TariffColumn[];
}

export interface TariffVarOption {
  varCode: string;
  varName?: string;
}

export const TARIFF_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT_IN'];
export const TARIFF_SORT_ORDERS = ['ASC', 'DESC', 'NONE'];
export const TARIFF_DATA_TYPES = ['STRING', 'NUMBER'];
