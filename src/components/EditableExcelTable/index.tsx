import { useRef } from 'react';
import useEditableExcelTable, { UseEditableTableProvider } from './hooks/useEditableExcelTable';
import TableBody from './TableComponents/TableBody';
import TableHead from './TableComponents/TableHead';
import { EditableExcelTableProps } from './types';
import { cn } from 'src/constants/helpers';

const EditableExcelTableImpl = ({ columns, data, onChange }: EditableExcelTableProps) => {
  const { tableBodyRef } = useEditableExcelTable(data, columns);
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const rowLineRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative isolate max-h-[max(400px,_calc(100vh-300px))] overflow-auto overscroll-contain border">
      <table className={cn('min-h-[60px] min-w-full table-fixed border-collapse', '[&_.no-data-cell]:hidden [&_.show-in-export]:!hidden')}>
        <thead>
          <TableHead columns={columns} />
        </thead>
        <tbody ref={tableBodyRef}>
          <TableBody tableBodyRef={tableBodyRef} containerRef={containerRef} rangeRef={rangeRef} rowLineRef={rowLineRef} />
        </tbody>
      </table>
      <div
        ref={(node) => {
          if (node) {
            rowLineRef.current = node;
            node.style.width = `${tableBodyRef.current?.clientWidth}px`;
          }
        }}
        className="z-1 pointer-events-none absolute left-0 top-[50%] hidden h-[2px] w-full bg-theme"
      />
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
