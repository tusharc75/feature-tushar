import { useRef } from 'react';
import { cn } from 'src/constants/helpers';
import useEditableExcelTable, { UseEditableTableProvider, useEditableTableStore } from './hooks/useEditableExcelTable';
import TableBody from './TableComponents/TableBody';
import TableHead from './TableComponents/TableHead';
import { EditableExcelTableProps } from './types';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const EditableExcelTableImpl = ({ columns, data, onChange, onDelete, onAiImport }: EditableExcelTableProps) => {
  const { tableBodyRef } = useEditableExcelTable(data, columns, onChange);
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const rowLineRef = useRef<HTMLDivElement>(null);
  const [stableColumns] = useEditableTableStore((store) => store.columns);

  return (
    <>
      {onAiImport && (
        <div className="flex justify-end mb-3">
          <input
            id="ai-import-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append('file', file);

              onAiImport(formData);

              e.target.value = '';
            }}
          />
          <ThemeButton buttonType="theme" onClick={() => document.getElementById('ai-import-input')?.click()}>
            AI Import
          </ThemeButton>
        </div>
      )}
      <div ref={containerRef} className="relative isolate max-h-[max(400px,_calc(100vh-300px))] overflow-auto overscroll-contain border">
        <table className={cn('min-h-[60px] min-w-full table-fixed border-collapse', '[&_.no-data-cell]:hidden [&_.show-in-export]:!hidden')}>
          <thead>
            <TableHead columns={stableColumns} />
          </thead>
          <tbody ref={tableBodyRef}>
            <TableBody onDelete={onDelete} tableBodyRef={tableBodyRef} containerRef={containerRef} rangeRef={rangeRef} rowLineRef={rowLineRef} />
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
    </>
  );
};

const EditableExcelTable = (props: EditableExcelTableProps) => (
  <UseEditableTableProvider>
    <EditableExcelTableImpl {...props} />
  </UseEditableTableProvider>
);
export default EditableExcelTable;
