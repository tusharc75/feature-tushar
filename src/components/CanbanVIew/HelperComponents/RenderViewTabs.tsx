import { IconButton } from '@mui/material';
import React from 'react';
import { PiTableDuotone, PiTextColumns } from 'react-icons/pi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type RenderViewTabsProps = {
  viewType: 'table' | 'canban';
  setViewType: React.Dispatch<React.SetStateAction<'table' | 'canban'>>;
};

export const RenderViewTabs = ({ setViewType, viewType }: RenderViewTabsProps) => {
  return (
    <div className="flex gap-1 rounded-md border bg-gray-100 p-[3px] dark:bg-neutral-800">
      <HtmlTooltip title="Table View">
        <IconButton
          size="small"
          onClick={() => setViewType('table')}
          sx={{ borderRadius: '6px', background: viewType === 'table' ? 'var(--dark-primary, white)' : 'transparent' }}
        >
          <PiTableDuotone />
        </IconButton>
      </HtmlTooltip>
      <HtmlTooltip title="Canban View">
        <IconButton
          size="small"
          onClick={() => setViewType('canban')}
          sx={{ borderRadius: '6px', background: viewType === 'canban' ? 'var(--dark-primary, white)' : 'transparent' }}
        >
          <PiTextColumns />
        </IconButton>
      </HtmlTooltip>
    </div>
  );
};
