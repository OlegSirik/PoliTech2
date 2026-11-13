import { TariffColumn } from './tariff-table.model';

function normalizeOperator(op: string | undefined | null): string | null {
  if (op == null) {
    return null;
  }
  const value = op.trim().toUpperCase();
  switch (value) {
    case '=':
    case '>':
    case '<':
    case '>=':
    case '<=':
    case '<>':
      return value;
    case '!=':
      return '<>';
    case 'LIKE':
      return 'LIKE';
    default:
      return null;
  }
}

function normalizeOrder(order: string | undefined | null): string | null {
  if (order == null) {
    return null;
  }
  const value = order.trim().toUpperCase();
  return value === 'ASC' || value === 'DESC' ? value : null;
}

/** Как CoefficientServiceImpl#getSQL. Для линии бизнеса calculatorId = 0. */
export function buildCoefficientDataSql(calculatorId: number | string, coefficientCode: string, columns: TariffColumn[]): string | null {
  if (coefficientCode == null || columns == null) {
    return null;
  }

  let sql = 'select result_value from coefficient_data where calculator_id = ';
  sql += String(calculatorId);
  sql += " and coefficient_code = '";
  sql += String(coefficientCode).replace(/'/g, "''");
  sql += "'";

  let orderBy = '';
  for (const column of columns) {
    if (column == null) {
      continue;
    }
    const nr1 = parseInt(String(column.nr).trim(), 10);
    if (Number.isNaN(nr1)) {
      return null;
    }
    const nr = String(nr1 - 1);
    if (column.varCode == null || column.conditionOperator == null || !/^(10|[0-9])$/.test(nr)) {
      return null;
    }
    const operator = normalizeOperator(column.conditionOperator);
    if (operator == null) {
      return null;
    }
    const numeric = column.varDataType?.toUpperCase() === 'NUMBER';
    sql += numeric
      ? ` AND to_number(col${nr},'9999999999.99') ${operator}:${column.varCode}`
      : ` AND col${nr} ${operator} :${column.varCode}`;

    const order = normalizeOrder(column.sortOrder);
    if (order != null) {
      orderBy += orderBy.length === 0 ? ' order by ' : ', ';
      orderBy += numeric ? `to_number(col${nr},'9999999999.99') ` : `col${nr} `;
      orderBy += ` ${order}`;
    }
  }

  if (orderBy.length > 0) {
    sql += orderBy;
  }
  return `${sql} limit 1`;
}
