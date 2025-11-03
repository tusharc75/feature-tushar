import { RowSelectionState, Table } from '@tanstack/react-table';
import { useEffect } from 'react';
import { ExtendedTInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';

const useCustomContentSelection = ({
  state,
  getChildId,
  subItemAccessor,
  rowSelection,
  table
}: {
  state: ExtendedTInitialState;
  getChildId: (data: any) => string;
  subItemAccessor: (data: any) => any[];
  rowSelection: RowSelectionState;
  table: Table<any>;
}) => {
  const { setSelectedSubItemsMap } = state;

  useEffect(() => {
    const selectedRowsId = Object.keys(rowSelection || {});
    if (!selectedRowsId || selectedRowsId.length === 0) {
      setSelectedSubItemsMap(new Map());
      return;
    }
    const selectedRows = selectedRowsId.map((id) => table.getRow(id));
    const newSelectedSubItems = selectedRows.reduce((map, parentRow) => {
      const original = parentRow.original;
      const id = original['_id'];
      const innerMap = new Map<string, any>();
      const subRows = subItemAccessor?.(original);
      if (subRows && subRows.length) {
        subRows.forEach((d) => {
          const childId = getChildId(d);
          innerMap.set(childId, d);
        });
        map.set(id, innerMap);
      }
      return map;
    }, new Map<string, Map<string, any>>());
    setSelectedSubItemsMap(newSelectedSubItems);
  }, [rowSelection]);
};

export default useCustomContentSelection;
