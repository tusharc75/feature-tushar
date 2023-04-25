import React from 'react';
import { Tooltip, IconButton } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const RefreshButton = ({ isOffline, refreshGrid = null, style = {}, ...otherProps }) => {
  return refreshGrid ? (
    <HtmlTooltip title="Refresh" placement="top">
      <IconButton
        {...otherProps}
        style={{
          width: '46px',
          height: '32px',
          background: 'white',
          padding: '11px',
          border: '1px solid #DEDEDE',
          color: '#424242',
          ...style
        }}
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
