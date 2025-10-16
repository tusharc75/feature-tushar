import { useEffect, useMemo, useRef } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { handlePaste, pasteListener } from 'src/components/EditableExcelTable/utils';
import createFastContext from 'src/StateProvider/createFastContext';

export type StoreState = {
  tableData: any[];
  dirtyRows: any[];
  columns: TColType[];
  selectedRow: number | null;
  pasteKey: number;
  columnsMap: Map<string, TColType>;
};
const initialState: StoreState = {
  dirtyRows: [],
  tableData: [],
  columns: [],
  selectedRow: null,
  pasteKey: 0,
  columnsMap: new Map()
};

const { Provider: UseEditableTableProvider, useStore: useEditableTableStore } = createFastContext<StoreState | null>(initialState);
export { UseEditableTableProvider, useEditableTableStore };

const useEditableExcelTable = (data: any[], columns: TColType[]) => {
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [, setStore] = useEditableTableStore((prev) => prev.dirtyRows);

  const columnsMap = useMemo(() => {
    const map = new Map<string, TColType>();
    for (const c of columns) {
      map.set(c.id || c.accessor, c);
    }
    setStore({ columnsMap: map });
    return map;
  }, [columns, setStore]);

  useEffect(() => {
    setStore({ tableData: data });
  }, [data, setStore]);

  useEffect(() => {
    setStore({ columns });
  }, [columns, setStore]);

  useEffect(() => {
    const tbody = tableBodyRef.current;
    if (!tbody) return;

    const pasteWrapper = (e: ClipboardEvent) => {
      // The cell where paste happened
      pasteListener(e, (event, pastedData) => handlePaste({ event, columnsMap, setStore, pastedData }));
    };

    tbody.addEventListener('paste', pasteWrapper);
    return () => {
      tbody.removeEventListener('paste', pasteWrapper);
    };
  }, [columnsMap, setStore]);

  return {
    tableBodyRef
  };
};

export default useEditableExcelTable;
