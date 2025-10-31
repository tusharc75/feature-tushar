import { useMemo } from 'react';
import { UseCardColTimeline } from 'src/components/CardColTimeline1/types';

const useHandleSelection = ({
  state,
  column,
  data,
  subItemAccessor = () => [],
  getChildId
}: {
  state: UseCardColTimeline<any, any>;
  column: string;
  data: any;
  subItemAccessor: (data: any) => any[];
  getChildId: (children: any) => string;
}) => {
  const { keyGetter, selectedRecordMap, setSelectedRecordMap, setSelectedSubItemsMap } = state;

  const isAllSelected = useMemo(() => {
    return selectedRecordMap.get(column)?.size === data?.length;
  }, [data?.length, selectedRecordMap, column]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRecordMap((prev) => {
        const newVal = new Map(prev);
        newVal.set(column, new Map());
        return newVal;
      });
    } else {
      setSelectedRecordMap((prev) => {
        const outerMap = new Map(prev);
        const innerMap = new Map<string, any>();
        data?.forEach((d) => {
          innerMap.set(keyGetter(d), d);
        });
        outerMap.set(column, innerMap);
        return outerMap;
      });
    }
  };

  const handleSelectSingle = (data: any) => {
    setSelectedRecordMap((prev) => {
      const outerMap = new Map(prev);
      const innerMap = outerMap.get(column) || new Map();
      const parentRowKey = keyGetter(data);
      const subItems = subItemAccessor(data);
      const wasSelected = innerMap.has(parentRowKey);
      if (wasSelected) {
        innerMap.delete(parentRowKey);
      } else {
        innerMap.set(parentRowKey, data);
      }

      // select-unselect sub rows
      setSelectedSubItemsMap((prev) => {
        const outerSubItemData = new Map(prev);
        if (wasSelected) {
          outerSubItemData.delete(parentRowKey);
        } else {
          const innerSubItemData = outerMap.get(parentRowKey) || new Map();
          subItems.forEach((d) => {
            innerSubItemData.set(getChildId(d), d);
          });
          outerSubItemData.set(parentRowKey, innerSubItemData);
        }
        return outerSubItemData;
      });

      outerMap.set(column, innerMap);
      return outerMap;
    });
  };

  return {
    isAllSelected,
    handleSelectAll,
    handleSelectSingle
  };
};

export default useHandleSelection;
