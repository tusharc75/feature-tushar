import React, { FC } from 'react';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { IconButton } from '@material-ui/core';

interface GridHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  refreshGrid: () => void | null;
  children?: React.ReactNode;
  buttons?: React.ReactNode;
  loading: boolean;
  startButtons?: React.ReactNode;
}

const GridHeader: FC<GridHeaderProps> = ({ refreshGrid, children, buttons, className, loading, startButtons, ...others }) => {
  return (
    <div className={`flex items-center justify-between my-[8px] gap-[8px] flex-wrap ${className}`} {...others}>
      <div className="flex-grow">{children}</div>
      <div className="buttons flex flex-wrap gap-[8px] justify-between w-full min-[768px]:w-[unset] ml-auto">
        <div className="buttons flex flex-wrap gap-[8px]">{startButtons}</div>
        <div className="buttons flex flex-wrap gap-[8px] ">
          {buttons}
          {refreshGrid && (
            <HtmlTooltip title="Refresh" placement="top" arrow>
              <IconButton
                className={`refresh-arrange-button`}
                color="primary"
                disabled={loading}
                size="small"
                onClick={() => {
                  refreshGrid();
                }}
              >
                <RefreshIcon style={{ fontSize: '20px' }} />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default GridHeader;
