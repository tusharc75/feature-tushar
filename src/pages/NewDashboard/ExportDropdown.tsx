import React from 'react';
import { Menu, MenuItem } from '@material-ui/core';
import exportData from './exportData';

interface Props {
  anchorEl: any;
  setAnchorClose: any;
  currency: string;
  tableData: any[];
  chart: {
    col: any;
    type: string;
    filters: { key: string; title: string; multiple: boolean }[];
    title: string;
    kpi: string;
    hasFilter: boolean;
    hasTableView: boolean;
    hasExport: boolean;
    uniqueId: string;
    axis?: string;
    numberOfCards?: number;
  };
}

const ExportDropdown = ({ anchorEl, setAnchorClose, currency, tableData, chart }: Props) => {
  const handleClose = (type: string) => {
    if (type) {
      exportData(type, currency, tableData, chart);
    } else {
      setAnchorClose(null);
    }
  };

  return (
    <Menu
      id="export-menu"
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={() => {
        handleClose('');
      }}
    >
      <MenuItem onClick={() => handleClose('ppt')}>Powerpoint</MenuItem>
      <MenuItem onClick={() => handleClose('pdf')}>PDF</MenuItem>
      <MenuItem onClick={() => handleClose('excel')}>Excel</MenuItem>
      <MenuItem onClick={() => handleClose('json')}>Raw JSON</MenuItem>
    </Menu>
  );
};

export default ExportDropdown;
