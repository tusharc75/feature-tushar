import dayjs from 'dayjs';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import FieldList from 'src/components/FormBuilder/FieldList';

export function cleanPastedValue({ key, columnsMap, value }: { key: string; columnsMap: Map<string, TColType>; value: string }) {
  const col = columnsMap.get(key);
  const type = col.type;
  if (([FieldList.DATE.type, FieldList.DATETIME.type] as (typeof col.type)[]).includes(type) && dayjs(value).isValid()) {
    return dayjs.tz(value).toISOString();
  }
  if (
    // prettier-ignore
    ([FieldList.CURRENCYAMOUNT.type, 
      FieldList.CURRENCYNUMBER.type, 
      FieldList.NUMBER.type, 
      FieldList.DECIMAL.type] as (typeof col.type)[]).includes(type)
  ) {
    return convertStringToNumber(value);
  }

  return value;
}

export function getCellValueText(column: TColType, data: any) {
  if (column?.lookup && column?.type === 'dropDown') {
    return data[`${column.id}Id`];
  }
  if (column?.lookup && column?.type === 'multiSelect') {
    return [...(data[`${column.id}Id`] ? [data[`${column.id}Id`]] : []), ...(data[`rest${column.id}`]?.map((o) => o?.optionValue) || [])];
  }
  return data[column.id];
}

export function convertStringToNumber(value: string): number {
  if (!value) return NaN;
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned);
}

export async function copyRangeToClipboard(data: string[][]) {
  const tsv = data.map((row) => row.join('\t')).join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
    console.log('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

export function getRange(start: { row: number; col: number }, end: { row: number; col: number }) {
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const map = new Map<string, boolean>();
  const twoDimentionalArray: number[][] = [];

  const cells: { row: number; col: number }[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push({ row: r, col: c });
      map.set(`${r}_${c}`, true);
      if (twoDimentionalArray[r]) {
        twoDimentionalArray[r].push(c);
      } else {
        twoDimentionalArray[r] = [c];
      }
    }
  }
  return { cells, map, twoDimentionalArray };
}
