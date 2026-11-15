import { CoefficientDataRow } from '../../../core/api/catalog.models';

export async function exportCoefficientExcel(filename: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  const xlsx = await import('xlsx');
  const sheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, sheet, 'Coefficient Data');
  xlsx.writeFile(book, filename);
}

export function pickCoefficientExcel(columnCount: number): Promise<CoefficientDataRow[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        void readRows(reader.result, columnCount).then(resolve, () => resolve(null));
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}

async function readRows(data: string | ArrayBuffer | null, columnCount: number): Promise<CoefficientDataRow[]> {
  const xlsx = await import('xlsx');
  const book = xlsx.read(data, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  const table = xlsx.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, defval: '', raw: false });
  if (table.length) {
    table.shift();
  }
  return table
    .filter((row) => Array.isArray(row) && row.some((cell) => cell !== '' && cell != null))
    .map((row) => {
      const cells = row.map((cell) => (cell == null ? '' : String(cell)));
      const resultRaw = cells.length ? cells[cells.length - 1] : '';
      const conditions = cells.slice(0, -1);
      while (conditions.length < columnCount) {
        conditions.push('');
      }
      const result = Number(resultRaw.replace(/\s/g, '').replace(',', '.'));
      return {
        conditionValue: conditions.slice(0, columnCount).map((value) => (value === '' ? null : value)),
        resultValue: Number.isFinite(result) ? result : 0,
      };
    });
}
