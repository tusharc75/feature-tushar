import React, { useMemo, useState } from 'react';
import { Group } from 'src/components/CardColTimeline1/types';

const useGroups = ({
  setGroups,
  fetchGroupData,
  groupByButtonItems,
  groups
}: {
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  groups: Group[] | null;
  groupByButtonItems: { optionValue: string; optionLabel: string }[];
  fetchGroupData: (d: string) => Promise<Group[]>;
}) => {
  const isGrouppingEnabled = useMemo(() => {
    return groupByButtonItems && groupByButtonItems.length && fetchGroupData && typeof fetchGroupData === 'function';
  }, [fetchGroupData, groupByButtonItems]);

  const [isGroupDataFetching, setIsGroupDataFetching] = useState(true);
  const [groupSelectorValue, setGroupSelectorValue] = useState<{ optionValue: string; optionLabel: string }>({
    optionLabel: 'Group',
    optionValue: 'none'
  });

  return {
    isGrouppingEnabled,
    isGroupDataFetching,
    groupSelectorValue,
    groupByButtonOptions: [
      {
        optionLabel: 'Group',
        optionValue: 'none'
      },
      ...(groupByButtonItems ? [...groupByButtonItems] : [])
    ],
    setGroupSelectorValue
  };
};

export default useGroups;
