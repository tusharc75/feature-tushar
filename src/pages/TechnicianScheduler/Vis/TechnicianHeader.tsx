import { Gamepad, Map } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import useLocalStorage from 'src/hooks/useLocalStore';
import SearchButton from 'src/pages/TechnicianScheduler/SearchButton';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { SHOW_MESSAGE_KEY } from 'src/pages/TechnicianScheduler/Vis/utils';
import { DataSet } from 'vis-timeline/standalone';

const TechnicianHeader = ({
  timelineData
}: {
  timelineData: {
    groups: DataSet<any, 'id'> | null;
    items: DataSet<any, 'id'> | null;
  };
}) => {
  const [, setShowMessage] = useLocalStorage(SHOW_MESSAGE_KEY);
  const [, setStore] = useTimelineStore((state) => state.mapData);
  const [searchValue, setSearchValue] = useState('');

  const handleMapCLick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    let userIds: string[] = [];
    timelineData.groups.forEach((d) => {
      if (d?.user?.optionValue) {
        userIds.push(d?.user?.optionValue);
      }
    });
    setStore({ mapData: userIds });
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    const searchFor = value.trim().toLowerCase();
    timelineData.groups?.forEach((data, id) => {
      if (data.visible) {
        timelineData.groups.updateOnly({ ...data, visible: false }, id);
      }
      const compString = `${data?.firstName} ${data?.lastName} ${data?.competencyType?.optionLabel || ''}`.toLowerCase();
      if (compString.includes(searchFor) || searchFor === '') {
        timelineData.groups.updateOnly({ ...data, visible: true }, id);
      }
    });
  };

  return (
    <div className="flex flex-grow items-center justify-between px-4">
      <h6 className="line-clamp-1 text-[1rem] font-semibold">Technicians</h6>
      <div className="flex">
        <SearchButton setValue={handleSearch} value={searchValue} maxWidth={'260px'} />
        <HtmlTooltip title="Map">
          <IconButton size="small" color="primary" onClick={handleMapCLick}>
            <Map fontSize="small" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'Show Controls'}>
          <IconButton onClick={() => setShowMessage(true)} size="small" color="primary">
            <Gamepad fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </div>
    </div>
  );
};

export default TechnicianHeader;
