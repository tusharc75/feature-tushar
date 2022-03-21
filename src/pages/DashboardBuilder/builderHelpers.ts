import { GridSize } from '@material-ui/core';

export const GRAPH_TYPES = ['Chart', 'Table', 'Map'];
export const CHART_TYPES = ['Line', 'Bar', 'Pie', 'Doughnut'];
export const FILTERS_OPTIONS = ['Customer Account', 'Products', 'Market Segment', 'Sub Market Segment', 'Sales Rep', 'Product Category'];
export const baseURL = '/dashboard-master';

export interface IFormDataType {
  uniqueId?: string;
  column: GridSize | any;
  graphType: string;
  chartType: string;
  chartTitle: string;
  hasFilters?: boolean;
  hasTableView?: boolean;
  hasExport?: boolean;
  filters?: string[];
}

export const defaultFormConfigs = {
  column: 6,
  graphType: '',
  chartType: '',
  chartTitle: '',
  hasFilters: false,
  hasTableView: false,
  hasExport: false,
  filters: []
};
