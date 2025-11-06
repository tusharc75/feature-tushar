import { useCallback, useEffect, useMemo, useState } from 'react';
import { Group } from 'src/components/CardColTimeline/types';
import useLocalStorage from 'src/hooks/useLocalStore';

const defaultValue = { optionLabel: 'Group', optionValue: 'null' };

const localStorageKey = 'card-col-timeline-group-by';

const useGroups = ({
  fetchGroupData,
  groupByButtonItems,
  renderedFrom,
  refreshSignal
}: {
  groupByButtonItems: { optionValue: string; optionLabel: string }[];
  fetchGroupData: (d: string) => Promise<Group[]>;
  renderedFrom: string;
  refreshSignal: boolean;
}) => {
  const [groups, setGroups] = useState<Group[]>(null);
  const key = groupByButtonItems?.map((d) => d.optionValue[0]).join('-');
  const isGrouppingEnabled = useMemo(() => {
    return groupByButtonItems && groupByButtonItems.length && fetchGroupData && typeof fetchGroupData === 'function';
  }, [fetchGroupData, groupByButtonItems]);
  const [isGroupDataFetching, setIsGroupDataFetching] = useState(true);
  const [groupSelectorValue, setGroupSelectorValue] = useLocalStorage(`${key}-${renderedFrom}-${localStorageKey}`, defaultValue);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupDataWrapper = async () => {
      if (!isGrouppingEnabled || groupSelectorValue.optionValue === 'null') return;
      setIsGroupDataFetching(true);
      try {
        const data = await fetchGroupData(groupSelectorValue.optionValue);
        if (data) {
          setGroups(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsGroupDataFetching(false);
      }
    };
    fetchGroupDataWrapper();
    return () => {
      setGroups(null);
    };
  }, [fetchGroupData, groupSelectorValue.optionValue, isGrouppingEnabled, refreshSignal]);

  const toggleExpand = useCallback((group: Group) => {
    setExpandedGroup((prev) => (prev === group.optionValue ? null : group.optionValue));
  }, []);

  return {
    isGrouppingEnabled,
    isGroupDataFetching,
    groupSelectorValue,
    groupByButtonOptions: [defaultValue, ...(groupByButtonItems ? [...groupByButtonItems] : [])],
    setGroupSelectorValue,
    groups,
    toggleExpand,
    expandedGroup
  };
};

export default useGroups;

export type UseGroups = ReturnType<typeof useGroups>;
