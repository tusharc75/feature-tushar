import { useEffect, useMemo, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { MOVE_SELECTED_CELL, SELECTED_RANGE, SelectedRange, TMoveCellEvent } from 'src/components/EditableExcelTable/CustomEvents';
import { handlePaste, pasteListener } from 'src/components/EditableExcelTable/utils';
import { useEffectEvent } from 'src/hooks/useEffectEvent';
import createFastContext from 'src/StateProvider/createFastContext';

export type StoreState = {
  tableData: any[];
  dirtyRows: any[];
  columns: TColType[];
  selectedRow: number | null;
  pasteKey: number;
  columnsMap: Map<string, TColType>;
  moveEventData: TMoveCellEvent | null;
  rowErrors: Map<string, string>[];
  touchedRows: Map<number, boolean>;
};
const initialState: StoreState = {
  dirtyRows: [],
  tableData: [],
  columns: [],
  selectedRow: null,
  pasteKey: 0,
  columnsMap: new Map(),
  moveEventData: null,
  rowErrors: [],
  touchedRows: new Map()
};

const EXCLUDED_COLUMNS = ['actions', 'action', 'index', 'selection', 'expander'];

const getStableColumns = (columns: TColType[]) => {
  return columns.filter((d) => !EXCLUDED_COLUMNS.includes(d.id ?? d.accessor));
};

const { Provider: UseEditableTableProvider, useStore: useEditableTableStore } = createFastContext<StoreState | null>(initialState);
export { UseEditableTableProvider, useEditableTableStore };

const MIN_DATA = 10;
const stableEmptyArray = [];

const useEditableExcelTable = (data: any[], columns: TColType[], onChange: (data: any[]) => void) => {
  const [stableColumns, setStableColumns] = useState(() => columns.filter((d) => !EXCLUDED_COLUMNS.includes(d.id ?? d.accessor)));
  const sendUpdateTimeout = useRef<NodeJS.Timeout>(null);
  const selectedRange = useRef<SelectedRange | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [dirtyRows, setStore] = useEditableTableStore((prev) => prev.dirtyRows);
  const [rowErrors] = useEditableTableStore((prev) => prev.rowErrors);

  useEffect(() => {
    const handleListen = (e: CustomEvent<TMoveCellEvent>) => {
      setStore({ moveEventData: e.detail });
    };
    window.addEventListener(MOVE_SELECTED_CELL, handleListen);
    return () => {
      window.removeEventListener(MOVE_SELECTED_CELL, handleListen);
    };
  }, []);

  // listen for range change
  useEffect(() => {
    const handleRangeChange = (e: CustomEvent<SelectedRange>) => {
      selectedRange.current = e.detail;
    };

    window.addEventListener(SELECTED_RANGE, handleRangeChange);
    return () => {
      window.removeEventListener(SELECTED_RANGE, handleRangeChange);
    };
  }, []);

  const columnsMap = useMemo(() => {
    const map = new Map<string, TColType>();
    for (const c of columns) {
      map.set(c.id || c.accessor, c);
    }
    setStore({ columnsMap: map });
    return map;
  }, [columns, setStore]);

  useEffect(() => {
    const newData = data;
    if (data.length < MIN_DATA) {
      for (let i = data.length; i < MIN_DATA; i++) {
        newData.push({});
      }
    }
    setStore({ tableData: newData });
  }, [data, setStore]);

  useEffect(() => {
    const stableColumns = getStableColumns(columns);
    setStableColumns(stableColumns);
  }, [columns]);

  useEffect(() => {
    setStore({ columns: stableColumns });
  }, [stableColumns, setStore]);

  useEffect(() => {
    const tbody = tableBodyRef.current;
    if (!tbody) return;

    const pasteWrapper = (e: ClipboardEvent) => {
      // The cell where paste happened

      pasteListener(e, (event, pastedData) => {
        handlePaste({ event, columnsMap, setStore, pastedData, selectedRange: selectedRange.current, tableBody: tableBodyRef.current });
      });
    };

    tbody.addEventListener('paste', pasteWrapper);
    return () => {
      tbody.removeEventListener('paste', pasteWrapper);
    };
  }, [columnsMap, setStore]);

  const sendUpdate = useEffectEvent((dirtyRows: any[]) => {
    const newDirtyRows = dirtyRows.filter((_dr, index) => !rowErrors[index]).filter((d) => !!d);
    if (newDirtyRows.length === 0) return;
    if (typeof onChange === 'function') {
      onChange?.(newDirtyRows);
      setStore({ dirtyRows: stableEmptyArray });
    }
  });

  useEffect(() => {
    sendUpdateTimeout.current = setTimeout(() => {
      sendUpdate(dirtyRows);
    }, 1000);
    return () => {
      clearTimeout(sendUpdateTimeout.current);
    };
  }, [dirtyRows, sendUpdate]);

  return {
    tableBodyRef
  };
};

export default useEditableExcelTable;
