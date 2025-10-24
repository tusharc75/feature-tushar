import dayjs from 'dayjs';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { StoreState } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import FieldList from 'src/components/FormBuilder/FieldList';
import { dateFormat, dateTimeFormat, DEFAULT_TIME_ZONE, displayDate, displayDateTime, formatAmountWithCurrency } from 'src/constants/helpers';
import { SetFastContextStore } from 'src/StateProvider/createFastContext';

const user = JSON.parse(localStorage.getItem('userData'));

export function cleanPastedValue({ key, columnsMap, value }: { key: string; columnsMap: Map<string, TColType>; value: string }) {
  const col = columnsMap.get(key);
  const type = col.type as any;
  if (FieldList.DATE.type === type) {
    if (dayjs(value).isValid()) {
      const timezone = user?.user?.timezone || DEFAULT_TIME_ZONE;
      return dayjs.tz(value, dateFormat, timezone).toISOString();
    } else {
      return '';
    }
  }
  if (FieldList.DATETIME.type === type) {
    if (dayjs(value).isValid()) {
      const timezone = user?.user?.timezone || DEFAULT_TIME_ZONE;
      return dayjs.tz(value, dateTimeFormat, timezone).toISOString();
    } else {
      return '';
    }
  }
  if (
    // prettier-ignore
    ([FieldList.CURRENCYAMOUNT.type, 
      FieldList.CURRENCYNUMBER.type, 
      FieldList.NUMBER.type, 
      FieldList.DECIMAL.type]).includes(type)
  ) {
    return convertStringToNumber(value);
  }

  return value;
}

export function getCellValue(column: TColType, data: any) {
  if (column?.lookup && column?.type === FieldList.DROPDOWN.type) {
    return data[`${column.id}Id`];
  }
  if (column?.lookup && column?.type === FieldList.MULTISELECT.type) {
    const newData = [];
    if (data[`${column.id}Id`]) {
      newData.push(data[`${column.id}Id`]);
    }
    data[`rest${column.id}`]?.forEach((o) => newData.push(o?.optionValue));
    return newData;
  }
  return data[column.id];
}

export const getDropdownOptionValue = (column: TColType, data: any) => {
  const value = getCellValue(column, data);
  const options: TColType['option'] = [];
  const isValueArray = Array.isArray(value);
  for (const option of column.option) {
    if (typeof value === 'string' && option.optionValue === value) {
      return option;
    }
    if (isValueArray) {
      if (value.includes(option.optionValue)) options.push(option);
    }
  }
  return options.length > 0 ? options : null;
};

export function getCellFormattedValue(column: TColType, data: any) {
  const value = getCellValue(column, data);
  const type = column.type as any;
  const key = column.id || column.accessor;

  if ([FieldList.CURRENCYAMOUNT.type, FieldList.CURRENCYNUMBER.type, FieldList.NUMBER.type, FieldList.DECIMAL.type].includes(type)) {
    const currencyCode = user.user.currency;
    return formatAmountWithCurrency(currencyCode, value).fullFormatAmount;
  }
  if (FieldList.DATE.type === type) {
    return displayDate(value);
  }
  if (FieldList.DATETIME.type === type) {
    return displayDateTime(value);
  }
  if (FieldList.MULTISELECT.type === type) {
    const value: string[] = [];
    if (data[key]) {
      value.push(data[key]);
    }
    data[`rest${key}`]?.forEach((d) => {
      value.push(d.optionLabel);
    });
    return value.join(', ');
  }
  if (FieldList.DROPDOWN.type === type) {
    return data[key];
  }
  return value;
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

export const createEmptyRowData = (columns: TColType[]) => {
  const data: any = {};
  for (const col of columns) {
    const accessor = col.accessor || col.id;
    data[accessor] = null;
  }
  return data;
};

function parsePlainTextTable(text: string) {
  const rows = text.split(/\r?\n/).filter((r) => r.trim() !== '');
  const tableData = rows.map((row) => row.split(/\t/));
  return tableData;
}

function parseHTMLTable(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = [...doc.querySelectorAll('tr')];

  const tableData = rows.map((row) => {
    return [...row.querySelectorAll('td, th')].map((cell: HTMLElement) => cell.innerText.trim());
  });
  return tableData;
}

export const pasteListener = (event: ClipboardEvent, callBack: (e: ClipboardEvent, data: string[][]) => void) => {
  const clipboardData = event.clipboardData || (window as any).clipboardData;

  // Try HTML first (if copied from Excel/Sheets)
  const htmlData = clipboardData.getData('text/html');
  const textData = clipboardData.getData('text/plain');

  let structure: string[][] = [];
  if (htmlData) {
    structure = parseHTMLTable(htmlData);
  } else if (textData) {
    structure = parsePlainTextTable(textData);
  }
  callBack(event, structure);
};

const setPastedValue = ({
  columnsMap,
  key,
  value,
  rowObj
}: {
  key: string;
  columnsMap: Map<string, TColType>;
  value: string | number;
  rowObj: any;
}) => {
  const col = columnsMap.get(key);
  const type = col.type;
  let dirtyValue: any = value;
  rowObj[key] = value;

  if (col.lookup && FieldList.MULTISELECT.type === type && typeof value === 'string') {
    const values = value.split(', ');
    const options = col.option.filter((d) => values.includes(d.optionLabel));

    dirtyValue = [];
    options.forEach((d) => {
      dirtyValue.push(d.optionValue);
    });
    const [first, ...rest] = options;
    if (first) {
      rowObj[key] = first.optionLabel;
      rowObj[`${key}Id`] = first.optionValue;
    }
    if (rest.length) {
      rowObj[`rest${key}`] = rest;
    }
  }
  if (col.lookup && FieldList.DROPDOWN.type === type) {
    if (typeof value === 'string') {
      const option = col.option.find((d) => d.optionLabel === value);
      if (option) {
        rowObj[key] = option.optionLabel;
        rowObj[`${key}Id`] = option.optionValue;
        dirtyValue = option.optionValue;
      } else {
        rowObj[key] = '';
        rowObj[`${key}Id`] = '';
      }
    } else {
      rowObj[key] = '';
      rowObj[`${key}Id`] = '';
    }
  }

  return { dirtyValue };
};

const cleanDirtyRowData = (data: Record<string, any>, sortedCells: string[]) => {
  const dirtyRowMap = new Map(Object.entries(data));

  // delete multiselect cell rest values
  for (const cell of sortedCells) {
    if (dirtyRowMap.has(`rest${cell}`)) {
      dirtyRowMap.delete(`rest${cell}`);
    }
  }
  dirtyRowMap.forEach((d, key) => {
    if (key !== '_id' && !sortedCells.includes(key)) {
      dirtyRowMap.delete(key);
    }
  });

  return Object.fromEntries(dirtyRowMap);
};

export function handlePaste({
  columnsMap,
  event,
  pastedData,
  setStore
}: {
  event: ClipboardEvent;
  pastedData: string[][];
  columnsMap: Map<string, TColType>;
  setStore: SetFastContextStore<StoreState>;
}) {
  const targetCell = (event.target as HTMLElement)?.closest('[data-row][data-col]') as HTMLElement | null;
  if (pastedData.length === 0) return;
  if (!targetCell) return;
  event.preventDefault();
  event.stopPropagation();

  const sortedCells = [...targetCell.parentElement.querySelectorAll('td')]?.map((c) => c.getAttribute('data-key')).filter((d, i) => !!d && i !== 0);
  const rowIndex = Number(targetCell.getAttribute('data-row'));
  const colIndex = Number(targetCell.getAttribute('data-col'));

  setStore((prev) => {
    const newData = [...prev.tableData];
    const dirtyRows = [...prev.dirtyRows];

    for (let r = 0; r < pastedData.length; r++) {
      const dataRow = pastedData[r];
      const currentRowIndex = rowIndex + r;
      if (!newData[currentRowIndex]) {
        newData[currentRowIndex] = {} as any;
      }
      const dirtyRow: any = {};
      for (let c = colIndex; c < colIndex + dataRow.length && c < sortedCells.length; c++) {
        const colKey = sortedCells[c];

        if (colKey) {
          const cleanedValue = cleanPastedValue({ value: dataRow[c - colIndex], columnsMap, key: colKey });
          const { dirtyValue } = setPastedValue({ columnsMap, key: colKey, rowObj: newData[currentRowIndex], value: cleanedValue });
          dirtyRow[colKey] = dirtyValue;
        }
      }
      const dirtyRowData = cleanDirtyRowData({ ...newData[currentRowIndex], ...dirtyRow }, sortedCells);

      dirtyRows[currentRowIndex] = dirtyRowData;
    }
    return { tableData: newData, dirtyRows: dirtyRows, pasteKey: prev.pasteKey > 100 ? 0 : prev.pasteKey + 1 };
  });
}

export function renderCellText(data: any, column: TColType) {
  const cell = column.cell;
  if (typeof cell === 'string') {
    return cell;
  } else if (typeof cell === 'function') {
    const props = {
      row: {
        original: data
      }
    } as any;
    return cell(props);
  }
  return null;
}
