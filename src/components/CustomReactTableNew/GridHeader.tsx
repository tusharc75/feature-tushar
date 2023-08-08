import React, { FC } from 'react';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { IconButton } from '@material-ui/core';

interface GridHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  refreshGrid: () => void | null;
  children?: React.ReactNode;
  buttons?: React.ReactNode;
  loading: boolean;
}

const GridHeader: FC<GridHeaderProps> = ({ refreshGrid, children, buttons, className, loading, ...others }) => {
  return (
    <div className={`flex items-center justify-between my-[8px] gap-[8px] flex-wrap ${className}`} {...others}>
      <div>{children}</div>
      <div className="buttons flex flex-wrap gap-[8px]">
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
  );
};

export default GridHeader;
