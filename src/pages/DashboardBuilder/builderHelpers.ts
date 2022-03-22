import { GridSize } from '@material-ui/core';

export const GRAPH_TYPES = ['Chart', 'Table', 'Map'];

export const CHART_TYPES = ['Line', 'Bar', 'Pie', 'Doughnut'];

export const FILTERS_OPTIONS = [
  { title: 'Customer Account', key: 'customerAccount' },
  { title: 'Product', key: 'product' },
  { title: 'Market Segment', key: 'marketSegment' },
  { title: 'Sub Market Segment', key: 'subMarketSegment' },
  { title: 'Sales Rep', key: 'salesRep' },
  { title: 'Product Category', key: 'productCategory' },
  { title: 'Country', key: 'country' }
];

export const baseURL = '/dashboard-master';

export type IFilterType = {
  title: string;
  key: string;
};

export interface IFormDataType {
  uniqueId?: string;
  column: GridSize | any;
  graphType: string;
  chartType: string;
  chartTitle: string;
  hasFilters?: boolean;
  hasTableView?: boolean;
  hasExport?: boolean;
  filters?: IFilterType[];
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
