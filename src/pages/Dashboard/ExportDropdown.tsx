import React from 'react';
import { Menu, MenuItem } from '@material-ui/core';
import exportData from './exportData';
import { ChartDataType } from './ChartTypes';

interface Props {
  anchorEl: any;
  setAnchorClose: any;
  chartData?: any;
  currency: string;
  tableData: any[];
  chart: ChartDataType;
  isTableView?: boolean;
}

const ExportDropdown = ({ anchorEl, setAnchorClose, currency, tableData, chart, chartData, isTableView }: Props) => {
  const handleClose = (type: string) => {
    if ((chart.chartType === 'list' && tableData.length === 0) || (chart.chartType !== 'list' && !chartData) || !type) {
      setAnchorClose(null);
      return;
    }
    exportData(type, currency, tableData, chart, isTableView);
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
      {chart.hasTableView && <MenuItem onClick={() => handleClose('excel')}>Excel</MenuItem>}
      {chart.hasTableView && <MenuItem onClick={() => handleClose('json')}>Raw JSON</MenuItem>}
    </Menu>
  );
};

export default ExportDropdown;
