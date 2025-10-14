import React, { useRef } from 'react';
import { EditableExcelTableProps } from './types';
import TableHead from './TableComponents/TableHead';
import useEditableExcelTable from './hooks/useEditableExcelTable';
import TableBody from './TableComponents/TableBody';

const EditableExcelTable = ({ columns, data, onChange }: EditableExcelTableProps) => {
  const state = useEditableExcelTable(data, columns);
  const { tableBodyRef, tableData } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative isolate max-h-[calc(100vh-200px)] overflow-auto border">
      <table className="m-[-1px] min-w-full table-fixed border-collapse border">
        <thead>
          <TableHead columns={columns} />
        </thead>
        <tbody ref={tableBodyRef}>
          <TableBody columns={columns} data={tableData} state={state} containerRef={containerRef} rangeRef={rangeRef} />
        </tbody>
      </table>
      <div ref={rangeRef} className="pointer-events-none absolute z-[-1] hidden border border-blue-500 bg-blue-50 dark:bg-blue-950" />
    </div>
  );
};

export default EditableExcelTable;
