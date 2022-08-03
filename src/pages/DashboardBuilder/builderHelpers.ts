import { GridSize } from '@material-ui/core';
import { INVENTORY_STATUS } from 'src/constants/helpers';

const RentalStatus = Object.keys(INVENTORY_STATUS).map((key) => ({
  optionValue: INVENTORY_STATUS[key],
  optionLabel: INVENTORY_STATUS[key]
}));

const openCloseStatus = [
  {
    optionValue: "open",
    optionLabel: "Open",
  },
  {
    optionValue: "close",
    optionLabel: "Close",
  },
]

const quotesStatus = [
  { optionLabel: 'Open', optionValue: 'open' },
  { optionLabel: 'Won', optionValue: 'won' },
  { optionLabel: 'Lost', optionValue: 'lost' },
  { optionLabel: 'Offered', optionValue: 'offered' }
]

export const periodOption = [
  { optionLabel: "Monthly", optionValue: "monthly" },
  { optionLabel: "Quarterly", optionValue: "quaterly" },
]

export const GRAPH_TYPES = ['Chart', 'Table', 'Map', "Custom"];

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
  { title: 'Period', key: 'period' },
];

export const baseURL = '/dashboard-master';

export type IFilterType = {
  title: string;
  key: string;
  multiple?: boolean;
};

export type KPIListType = {
  id: string | number,
  graphType: string[],
  chartType?: string[],
  name: string;
  kpi: string;
  resource: string;
  custom?: boolean;
  horizontalBar?: false
  currencyConverter?: boolean;
  filters: IFilterType[]
};

export const statuses = {
  "asset/location-base-assets": RentalStatus,
  "asset/customer-in-rental": openCloseStatus,
  "quote/quote-customer-account": quotesStatus,
  "quote/sales-rep": quotesStatus
}

// export const kpiList: KPIListType[] = [
//   {
//     id: 1,
//     graphType: ["Map"],
//     resource: "Serialized Assets",
//     name: "Location Based Asset",
//     kpi: "asset/location-base-assets"
//   },
//   {
//     id: 2,
//     graphType: ["Chart"],
//     chartType: ["Pie"],
//     resource: "Serialized Assets",
//     name: "Asset Status Count",
//     kpi: 'asset/assets-status-count'
//   },
//   {
//     id: 3,
//     graphType: ["Chart"],
//     chartType: ["Bar"],
//     resource: "Serialized Assets",
//     name: "In Use By Category",
//     kpi: "asset/assets-in-use-by-category"
//   },
//   {
//     id: 2,
//     graphType: ["Chart"],
//     chartType: ["Pie"],
//     resource: "Serialized Assets",
//     name: "Asset Total In Use",
//     kpi: "asset/assets-total-in-use"
//   },
//   {
//     id: 2,
//     graphType: ["Chart"],
//     chartType: ["Pie"],
//     resource: "Rental Job",
//     name: "Customer in rental",
//     kpi: "asset/customer-in-rental"
//   },
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
// ]

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
}

export const defaultFormConfigs: IFormDataType = {
  column: 6,
  graphType: '',
  chartType: '',
  chartTitle: '',
  kpi: { name: "", kpi: "", resource: "", id: 0, graphType: [], chartType: [], filters: [] },
  hasFilters: false,
  hasTableView: false,
  hasExport: false,
  statusOptions: [],
  filters: []
};
