import React from 'react';
import { Tooltip, IconButton } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

const RefreshButton = ({ isOffline, refreshGrid = null, style = {}, ...otherProps }) => {
  return refreshGrid ? (
    <Tooltip title="Refresh" placement="top">
      <IconButton
        {...otherProps}
        style={{
          width: '46px',
          height: '32px',
          background: 'white',
          padding: '11px',
          border: '1px solid #e5e5e5',
          color: '#737373',
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
    </Tooltip>
  ) : (
    <></>
  );
};

export default RefreshButton;
