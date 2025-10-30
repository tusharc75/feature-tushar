import { useCallback, useState } from 'react';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

const useSelection = <D,>(getId: (data: D) => string = (d) => d['_id']) => {
  const [selectedRowMap, setSelectedRowMap] = useState<Map<string, D>>(new Map());

  const selectedRows = Array.from(selectedRowMap.values());

  const getIdStable = useEffectEvent(getId);

  const handleSelect = useCallback(
    (data: D, allData: D[], callBack: (isAllSelcted: boolean) => void = () => {}) => {
      setSelectedRowMap((prev) => {
        const id = getIdStable(data);
        const newSelectedRowmap = new Map(prev);
        if (newSelectedRowmap.has(id)) {
          newSelectedRowmap.delete(id);
        } else {
          newSelectedRowmap.set(id, data);
        }
        const isAllSelcted = allData.every((d) => newSelectedRowmap.has(getIdStable(d)));
        callBack(isAllSelcted);
        return newSelectedRowmap;
      });
    },
    [getIdStable]
  );

  const getIsRowSelected = useCallback(
    (data: D) => {
      return selectedRowMap.has(getIdStable(data));
    },
    [getIdStable, selectedRowMap]
  );

  const getIsAllSelected = useCallback(
    (allData: D[]) => {
      return allData.every((d) => selectedRowMap.get(getIdStable(d)));
    },
    [selectedRowMap, getIdStable]
  );

  const handleSelectAll = useCallback(
    (allData: D[]) => {
      const isallSelected = getIsAllSelected(allData);
      if (isallSelected) {
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
    [getIdStable, getIsAllSelected]
  );

  const handleUnselectAll = useCallback(() => {
    setSelectedRowMap(new Map());
  }, []);

  return {
    selectedRows,
    selectedRowMap,
    handleUnselectAll,
    handleSelect,
    getIsAllSelected,
    handleSelectAll,
    getIsRowSelected
  };
};

export default useSelection;
