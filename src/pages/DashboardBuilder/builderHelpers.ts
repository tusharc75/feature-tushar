import { GridSize } from '@material-ui/core';

export const GRAPH_TYPES = ['Chart', 'Table', 'Map'];
export const CHART_TYPES = ['Line', 'Bar', 'Pie', 'Doughnut'];
export const FILTERS_OPTIONS = ['Customer Account', 'Products', 'Market Segment', 'Sub Market Segment', 'Sales Rep', 'Product Category'];

export interface FormData {
  column: GridSize | any;
  graphType: string;
  chartType: string;
  chartTitle: string;
  hasFilters: boolean;
  hasTableView: boolean;
  hasExport: boolean;
  filters: string[];
}
