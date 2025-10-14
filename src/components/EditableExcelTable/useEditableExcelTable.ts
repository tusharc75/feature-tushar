import React, { useEffect, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

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
  columns,
  event,
  setTableData,
  pastedData
}: {
  event: ClipboardEvent;
  pastedData: string[][];
  columns: TColType[];
  setTableData: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const targetCell = (event.target as HTMLElement)?.closest('[data-row-index][data-cell-index]') as HTMLElement | null;
  if (pastedData.length === 0) return;
  if (!targetCell) return;
  event.preventDefault();
  event.stopPropagation();

  const sortedCells = [...targetCell.parentElement.querySelectorAll('td')]?.map((c) => c.getAttribute('data-key'));
  const rowIndex = Number(targetCell.getAttribute('data-row-index'));
  const colIndex = Number(targetCell.getAttribute('data-cell-index'));
  const columnKey = targetCell.getAttribute('data-key');

  setTableData((prev) => {
    const newData = [...prev];

    for (let r = 0; r < pastedData.length; r++) {
      const data = pastedData[r];
      const currentRowIndex = rowIndex + r;
      const tempData: any = {};
      for (let c = colIndex; c < data.length + colIndex; c++) {
        const colKey = sortedCells[c];
        if (newData[currentRowIndex]) {
          console.log(newData[currentRowIndex]);
          newData[currentRowIndex][colKey] = data[c];
        } else {
          console.log('hi');
          tempData[colKey] = data[c];
        }
      }
      if (Object.keys(tempData).length) {
        newData.push(tempData);
      }
    }
    console.log({ newData, rowIndex, sortedCells, columnKey, colIndex, pastedData });
    return newData;
  });
}

const useEditableExcelTable = (data: any[], columns: TColType[]) => {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [tableData, setTableData] = useState(data);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    const tbody = tableBodyRef.current;
    if (!tbody) return;

    const pasteWrapper = (e: ClipboardEvent) => {
      // The cell where paste happened
      pasteListener(e, (event, pastedData) => handlePaste({ event, columns, setTableData: setTableData, pastedData }));
    };

    tbody.addEventListener('paste', pasteWrapper);
    return () => {
      tbody.removeEventListener('paste', pasteWrapper);
    };
  }, [columns]);

  return {
    tableBodyRef,
    tableData
  };
};

export default useEditableExcelTable;
