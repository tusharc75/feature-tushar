import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { cleanPastedValue } from 'src/components/EditableExcelTable/utils';

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

const pasteListener = (event: ClipboardEvent, callBack: (e: ClipboardEvent, data: string[][]) => void) => {
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

function handlePaste({
  columnsMap,
  event,
  setTableData,
  pastedData,
  setDirtyRows
}: {
  event: ClipboardEvent;
  pastedData: string[][];
  columnsMap: Map<string, TColType>;
  setTableData: React.Dispatch<React.SetStateAction<any[]>>;
  setDirtyRows: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const targetCell = (event.target as HTMLElement)?.closest('[data-row][data-col]') as HTMLElement | null;
  if (pastedData.length === 0) return;
  if (!targetCell) return;
  event.preventDefault();
  event.stopPropagation();

  const sortedCells = [...targetCell.parentElement.querySelectorAll('td')]?.map((c) => c.getAttribute('data-key')).filter((d, i) => !!d && i !== 0);
  const rowIndex = Number(targetCell.getAttribute('data-row'));
  const colIndex = Number(targetCell.getAttribute('data-col'));

  setTableData((prev) => {
    const newData = [...prev];
    const dirtyRows = [];

    for (let r = 0; r < pastedData.length; r++) {
      const dataRow = pastedData[r];
      const currentRowIndex = rowIndex + r;
      if (!newData[currentRowIndex]) {
        newData[currentRowIndex] = {} as any;
      }
      for (let c = colIndex; c < colIndex + dataRow.length && c < sortedCells.length; c++) {
        const colKey = sortedCells[c];
        if (colKey) {
          const cleanedValue = cleanPastedValue({ value: dataRow[c - colIndex], columnsMap, key: colKey });
          newData[currentRowIndex][colKey] = cleanedValue;
        }
      }
      dirtyRows.push(newData[currentRowIndex]);
    }
    console.log({ newData, columnsMap, dirtyRows });
    setDirtyRows(dirtyRows);
    return newData;
  });
}

const useEditableExcelTable = (data: any[], columns: TColType[]) => {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [tableData, setTableData] = useState(data);
  const [dirtyRows, setDirtyRows] = useState<any[]>(null);

  const columnsMap = useMemo(() => {
    const map = new Map<string, TColType>();
    for (const c of columns) {
      map.set(c.id || c.accessor, c);
    }
    return map;
  }, [columns]);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    const tbody = tableBodyRef.current;
    if (!tbody) return;

    const pasteWrapper = (e: ClipboardEvent) => {
      // The cell where paste happened
      pasteListener(e, (event, pastedData) => handlePaste({ event, columnsMap, setTableData: setTableData, pastedData, setDirtyRows }));
    };

    tbody.addEventListener('paste', pasteWrapper);
    return () => {
      tbody.removeEventListener('paste', pasteWrapper);
    };
  }, [columnsMap]);

  return {
    tableBodyRef,
    tableData,
    dirtyRows,
    setTableData
  };
};

export default useEditableExcelTable;
