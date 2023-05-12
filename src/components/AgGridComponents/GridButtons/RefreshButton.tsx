import React from 'react';
import { Tooltip, IconButton } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const RefreshButton = ({ isOffline, className = '', refreshGrid = null, style = {}, ...otherProps }) => {
  return refreshGrid ? (
    <HtmlTooltip title="Refresh" placement="top" arrow>
      <IconButton
        {...otherProps}
        className={`refresh-arrange-button ${className}`}
        style={{
          ...style
        }}
        color="primary"
        disabled={isOffline}
        size="small"
        onClick={() => {
          refreshGrid();
        }}
      >
        <RefreshIcon style={{ fontSize: '20px' }} />
      </IconButton>
    </HtmlTooltip>
  ) : (
    <></>
  );
};

export default RefreshButton;
