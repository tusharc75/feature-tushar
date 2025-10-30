import { useCallback, useState } from 'react';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

const emptyMapRef = new Map();
const useSelection = <D,>({
  allData,
  getId = (d) => d['_id'],
  setSelectedSubItemsMap,
  selectedSubItemsMap,
  selectedRecordObj,
  column,
  rowId
}: {
  allData: D[];
  getId: (data: D) => string;
  setSelectedSubItemsMap: (paylod: Map<string, Map<string, any>>) => void;
  selectedSubItemsMap: Map<string, Map<string, any>>;
  selectedRecordObj: Partial<Record<any, any[]>>;
  column: string;
  rowId: string;
}) => {
  if (column === 'Pending') console.log({ selectedSubItemsMap, selectedRecordObj, column });

  const selectedRowMap = selectedSubItemsMap.get(rowId) || emptyMapRef;

  const setSelectedRowMap = useEffectEvent((payload: ((prev: Map<string, D>) => Map<string, D>) | Map<string, D>) => {
    let newVal: Map<string, D>;
    if (typeof payload === 'function') {
      newVal = payload(selectedRowMap);
    } else {
      newVal = payload;
    }
    const tempVal = new Map(selectedSubItemsMap);
    tempVal.set(rowId, newVal);
    setSelectedSubItemsMap(tempVal);
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

  const handleSelectAll = useCallback(
    (allData: D[]) => {
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
    },
    [getIdStable, isAllSelected, setSelectedRowMap]
  );

  const handleUnselectAll = useCallback(() => {
    setSelectedRowMap(new Map());
  }, []);

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
