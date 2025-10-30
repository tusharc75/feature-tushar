import { useCallback, useEffect, useState } from 'react';
import { UseCardColTimeline } from 'src/components/CardColTimeline1';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

const emptyMapRef = new Map();
const useSelection = <D,>({
  allData,
  getId = (d) => d['_id'],
  column,
  state,
  rowId,
  row
}: {
  allData: D[];
  getId: (data: D) => string;
  state: UseCardColTimeline<any, any>;
  column: string;
  rowId: string;
  row: any;
}) => {
  const { selectedSubItemsMap, setSelectedSubItemsMap, selectedRecordMap, setSelectedRecordMap } = state;

  // if (column === 'Pending') console.log({ column, selectedSubItemsMap, isParentSelected });

  const selectedRowMap = selectedSubItemsMap.get(rowId) || emptyMapRef;

  const setSelectedRowMap = useEffectEvent((payload: ((prev: Map<string, D>) => Map<string, D>) | Map<string, D>, setAllSelected = true) => {
    setSelectedSubItemsMap((prev) => {
      const outerVal = new Map(prev);
      let innerValue: Map<string, D>;
      if (typeof payload === 'function') {
        innerValue = payload(prev.get(rowId) || emptyMapRef);
      } else {
        innerValue = payload;
      }
      const allSelected = allData.every((d) => innerValue.has(getIdStable(d)));
      if (allSelected && setAllSelected) {
        setSelectedRecordMap((prev) => {
          const outer = new Map(prev);
          const inner = outer.get(column) || new Map();
          inner.set(rowId, row);
          outer.set(column, inner);
          return outer;
        });
      }
      outerVal.set(rowId, innerValue);
      return outerVal;
    });
  });

  const handleSelectAll = useEffectEvent(() => {
    if (isAllSelected) {
      setSelectedRowMap(new Map());
    } else {
      const newData = new Map<string, D>();
      for (const d of allData) {
        const id = getIdStable(d);
        newData.set(id, d);
      }
      setSelectedRowMap(newData);
    }
  });

  const selectedRows = Array.from(selectedRowMap.values());

  const getIdStable = useEffectEvent(getId);

  const handleSelect = useCallback(
    (data: D) => {
      setSelectedRowMap((prev) => {
        const id = getIdStable(data);
        const newSelectedRowmap = new Map(prev);
        if (newSelectedRowmap.has(id)) {
          newSelectedRowmap.delete(id);
        } else {
          newSelectedRowmap.set(id, data);
        }

        return newSelectedRowmap;
      });
    },
    [getIdStable, setSelectedRowMap]
  );

  const getIsRowSelected = useCallback(
    (data: D) => {
      return selectedRowMap.has(getIdStable(data));
    },
    [getIdStable, selectedRowMap]
  );

  const isAllSelected = allData.every((d) => selectedRowMap.get(getIdStable(d)));

  const handleUnselectAll = useCallback(() => {
    setSelectedRowMap(new Map());
  }, [setSelectedRowMap]);

  return {
    selectedRows,
    selectedRowMap,
    handleUnselectAll,
    handleSelect,
    isAllSelected,
    handleSelectAll,
    getIsRowSelected
  };
};

export default useSelection;
