import { IconButton } from '@mui/material';
import React, { useEffect } from 'react';
import { PiTableDuotone, PiTextColumns } from 'react-icons/pi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import useLocalStorage from 'src/hooks/useLocalStore';

type RenderViewTabsProps = {
  viewType: 'table' | 'kanban';
  setViewType: React.Dispatch<React.SetStateAction<'table' | 'kanban'>>;
  renderedFrom: string;
};

export const RenderViewTabs = ({ setViewType, viewType, renderedFrom }: RenderViewTabsProps) => {
  const [localViewType, setLocalViewType] = useLocalStorage<'table' | 'kanban'>(`kanban-view-type-${renderedFrom}`, 'table');

  useEffect(() => {
    setViewType(localViewType);
  }, [localViewType]);

  return (
    <div className="flex gap-1 rounded-md border bg-gray-100 p-[3px] dark:bg-neutral-800">
      <HtmlTooltip title="Table View">
        <IconButton
          size="small"
          onClick={() => setLocalViewType('table')}
          sx={{ borderRadius: '6px', background: viewType === 'table' ? 'var(--dark-primary, white)' : 'transparent' }}
        >
          <PiTableDuotone />
        </IconButton>
      </HtmlTooltip>
      <HtmlTooltip title="Kanban View">
        <IconButton
          size="small"
          onClick={() => setLocalViewType('kanban')}
          sx={{ borderRadius: '6px', background: viewType === 'kanban' ? 'var(--dark-primary, white)' : 'transparent' }}
        >
          <PiTextColumns />
        </IconButton>
      </HtmlTooltip>
    </div>
  );
};
