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

export type KPIListType = {
  name: string;
  kpi: string;
};

export const kpiList: KPIListType[] = [
  {
    name: "Location Based Asset",
    kpi: "asset/location-base-assets"
  },
  {
    name: "Asset Status Count",
    kpi: 'asset/assets-status-count'
  },
  {
    name: "In Use By Category",
    kpi: "asset/assets-in-use-by-category"
  },
  {
    name: "Asset Total In Use",
    kpi: "asset/assets-total-in-use"
  },
  {
    name: "Customer in rental",
    kpi: "asset/customer-in-rental"
  },
  // {
  //   name: "Total Booked GM vs Total Offered GM vs Budget",
  //   kpi: "sales"
  // },
  // {
  //   name: 'Quotes Status',
  //   kpi: 'open-quote',
  // },
  // {
  //   name: 'Quotes by Customer Account',
  //   kpi: 'quote/customer-account'
  // },
  // {
  //   name: 'Quotes by Sales Rep',
  //   kpi: 'quote/sales-rep'
  // },
  // {
  //   name: 'Top sellling product categories',
  //   kpi: 'products'
  // },
  // {
  //   name: 'Opportunity Trends',
  //   kpi: 'trend/opportunities'
  // },
  // {
  //   name: 'Created Leads',
  //   kpi: 'created/leads'
  // }
]

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
  hasStatus?: boolean;
  kpi: KPIListType;
  statusOptions?: { optionValue: string; optionLabel: string }[];
}

export const defaultFormConfigs: IFormDataType = {
  column: 6,
  graphType: '',
  chartType: '',
  chartTitle: '',
  kpi: { name: "", kpi: "" },
  hasFilters: false,
  hasTableView: false,
  hasExport: false,
  statusOptions: [],
  hasStatus: false,
  filters: []
};
