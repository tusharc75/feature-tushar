import { Row, Table } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExtendedTInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

type UseSelectionProps = {
  parentTableState: ExtendedTInitialState;
  state: ExtendedTInitialState;
  row: any;
  columns: TColType[];
  subRowAccessor: (row: any) => any[];
  parentRowId: string;
};

function shallowEqual(a: Record<string, boolean>, b: Record<string, boolean>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

const stableEmptyObj = {};

const useSelection = ({ parentTableState, state, row, columns, subRowAccessor }: UseSelectionProps) => {
  const { setSelectedSubItemsMap } = parentTableState;
  const [tableInstance, setTableInstance] = useState<Table<any>>(null);
  const lastEmitted = useRef<Record<string, boolean>>(stableEmptyObj);
  const lastApplied = useRef<Record<string, boolean>>(stableEmptyObj);

  const selectedRowsFromParent = useMemo(() => {
    return Array.from(parentTableState.selectedSubItemsMap.get(row._id)?.values() || []);
  }, [parentTableState.selectedSubItemsMap, row._id]);

  const defaultRowSelection = useMemo(() => {
    if (!selectedRowsFromParent.length) return stableEmptyObj;
    const next: Record<string, boolean> = {};
    for (const curr of selectedRowsFromParent) {
      next[`${curr._id}_0`] = true;
    }
    return next;
  }, [selectedRowsFromParent]);

  const selectedRows: Record<string, Row<any>> = tableInstance?.getSelectedRowModel()?.rowsById || stableEmptyObj;

  const handleSendSelectionEvent = useEffectEvent((selectedRows: Record<string, Row<any>>) => {
    if (!tableInstance) return;

    // if (!Object.keys(selectedRows).length) return;

    const next = Object.keys(selectedRows).reduce(
      (acc, k) => {
        acc[k] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );

    if (shallowEqual(lastEmitted.current, next)) return;
    lastEmitted.current = next;

    setSelectedSubItemsMap((prev) => {
      const newIds = Object.values(selectedRows).map((r) => r.original._id);
      const prevIds = Array.from(prev.get(row._id)?.keys() || []);
      if (prevIds.length === newIds.length && prevIds.every((id) => newIds.includes(id))) {
        return prev; // identical → no update
      }
      const outerMap = new Map<string, Map<string, any>>(prev);
      outerMap.set(row._id, new Map(newIds.map((id) => [id, selectedRows[id + '_0'].original])));
      return outerMap;
    });
  });

  useEffect(() => {
    handleSendSelectionEvent(selectedRows);
  }, [selectedRows, handleSendSelectionEvent, tableInstance]);

  useEffect(() => {
    const tableInstance = state.getTable();
    if (tableInstance) {
      setTableInstance(tableInstance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  useEffect(() => {
    if (!tableInstance) return;

    // const current = tableInstance.getState().rowSelection;
    if (!shallowEqual(lastApplied.current, defaultRowSelection)) {
      lastApplied.current = defaultRowSelection;
      tableInstance.setRowSelection(defaultRowSelection);
    }
  }, [tableInstance, defaultRowSelection]);

  return { tableInstance };
};

export default useSelection;
