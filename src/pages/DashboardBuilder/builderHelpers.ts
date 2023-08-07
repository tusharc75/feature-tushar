import { GridSize } from '@material-ui/core';
import { ASSET_STATUS } from 'src/constants/helpers';

const RentalStatus = Object.keys(ASSET_STATUS).map((key) => ({
  optionValue: ASSET_STATUS[key],
  optionLabel: ASSET_STATUS[key]
}));

const openCloseStatus = [
  {
    optionValue: 'open',
    optionLabel: 'Open'
  },
  {
    optionValue: 'close',
    optionLabel: 'Close'
  }
];

const quotesStatus = [
  { optionLabel: 'Open', optionValue: 'open' },
  { optionLabel: 'Won', optionValue: 'won' },
  { optionLabel: 'Lost', optionValue: 'lost' },
  { optionLabel: 'Offered', optionValue: 'offered' }
];

export const periodOption = [
  { optionLabel: 'Monthly', optionValue: 'monthly' },
  { optionLabel: 'Quarterly', optionValue: 'quaterly' }
];

export const GRAPH_TYPES = ['Chart', 'Table', 'Map', 'Custom'];

export const CHART_TYPES = ['Line', 'Bar', 'Pie', 'Doughnut'];

export const FILTERS_OPTIONS = [
  { title: 'Customer Account', key: 'customerAccount' },
  { title: 'Product', key: 'productDescription' },
  { title: 'Market Segment', key: 'marketSegment' },
  { title: 'Sub Market Segment', key: 'subMarketSegment' },
  { title: 'Sales Reps', key: 'salesReps' },
  { title: 'Plant', key: 'warehouse' },
  { title: 'Product Category', key: 'productCategory' },
  { title: 'Country Bill To', key: 'countryBillTo' },
  { title: 'Country Sell To', key: 'countrySellTo' },
  { title: 'Country', key: 'country' },
  { title: 'Status', key: 'status' },
  { title: 'Period', key: 'period' }
];

export const baseURL = '/dashboard-master';

export type IFilterType = {
  title: string;
  key: string;
  multiple?: boolean;
};

export type KPIListType = {
  id: string | number;
  graphType: string[];
  chartType?: string[];
  name: string;
  kpi: string;
  resource: string;
  custom?: boolean;
  horizontalBar?: false;
  currencyConverter?: boolean;
  filters: IFilterType[];
};

export const statuses = {
  'asset/location-base-assets': RentalStatus,
  'asset/customer-in-rental': openCloseStatus,
  'quote/quote-customer-account': quotesStatus,
  'quote/sales-rep': quotesStatus
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
  axis?: string;
  filters?: IFilterType[];
  kpi: KPIListType;
  statusOptions?: { optionValue: string; optionLabel: string }[];
  currency?: boolean;
  stack?:boolean
}

export const defaultFormConfigs: IFormDataType = {
  column: 6,
  graphType: '',
  chartType: '',
  chartTitle: '',
  kpi: { name: '', kpi: '', resource: '', id: 0, graphType: [], chartType: [], filters: [] },
  hasFilters: false,
  hasTableView: false,
  hasExport: false,
  statusOptions: [],
  filters: [],
  currency: false
};
