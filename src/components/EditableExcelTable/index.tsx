import React, { useEffect, useRef } from 'react';
import { EditableExcelTableProps } from './types';
import TableHead from './TableComponents/TableHead';
import useEditableExcelTable, { UseEditableTableProvider, useEditableTableStore } from './hooks/useEditableExcelTable';
import TableBody from './TableComponents/TableBody';

const EditableExcelTableImpl = ({ columns, data, onChange }: EditableExcelTableProps) => {
  const state = useEditableExcelTable(data, columns);
  const { tableBodyRef, tableData } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const [, setStore] = useEditableTableStore((prev) => prev?.dirtyRows);

  useEffect(() => {
    setStore(state);
  }, [state]);

  return (
    <div ref={containerRef} className="relative isolate max-h-[max(400px,_calc(100vh-300px))] overflow-auto overscroll-contain">
      <table className=" min-w-full table-fixed border-collapse border">
        <thead>
          <TableHead columns={columns} />
        </thead>
        <tbody ref={tableBodyRef}>
          <TableBody columns={columns} data={tableData} tableBodyRef={tableBodyRef} containerRef={containerRef} rangeRef={rangeRef} />
        </tbody>
      </table>
      <div ref={rangeRef} className="pointer-events-none absolute z-[-1] hidden border border-blue-500 bg-blue-50 dark:bg-blue-950" />
    </div>
  );
};

const EditableExcelTable = (props: EditableExcelTableProps) => (
  <UseEditableTableProvider>
    <EditableExcelTableImpl {...props} />
  </UseEditableTableProvider>
);
export default EditableExcelTable;
