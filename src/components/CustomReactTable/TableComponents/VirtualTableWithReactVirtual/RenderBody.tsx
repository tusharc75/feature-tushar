import React from 'react';
import { CellRenderer } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const RenderBody = ({
  columnIndex,
  key,
  style,
  cell,
  virtualization,
  state,
  setWholeRowsCellColor,
  table,
  dispatch,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  row,
  onRowClick
}: {
  columnIndex: number;
  key: string;
  style: React.CSSProperties;
  cell: any;

  virtualization: boolean;
  state: any;
  setWholeRowsCellColor: any;
  table: any;
  dispatch: any;
  setCellValue: any;
  submitInput: any;
  cellValue: any;
  resetField: any;
  row: any;
  onRowClick: any;
}) => {
  return (
    <div
      key={key}
      style={style}
      onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
      className="relative isolate  after:absolute after:inset-0 after:-z-10  after:[border-bottom:1px_solid_var(--common-border-color)] after:[content:'']"
    >
      <CellRenderer
        className="bg-transparent"
        virtualStyles={style}
        key={cell?.id}
        virtualization={virtualization}
        state={state}
        cell={cell}
        setWholeRowsCellColor={setWholeRowsCellColor}
        row={row}
        index={columnIndex}
        table={table}
        dispatch={dispatch}
        setCellValue={setCellValue}
        submitInput={submitInput}
        cellValue={cellValue}
        resetField={resetField}
        virtualTable={false}
      />
    </div>
  );
};

export default RenderBody;
