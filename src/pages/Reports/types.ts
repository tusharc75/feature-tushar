import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import useReport from 'src/pages/Reports/useReport';

export type Report = {
  title?: string;
  permission?: string;
  key?: string;
  type?: string;
  label?: string;
  route: string;
};

export type ReportWithSection = {
  section: string;
  reports: Report[];
};
export type CustomReport = {
  _id?: string;
  brand?: string;
  customReportName?: string;
  route: string;
  label: string;
};

export type FavouriteReport = {
  identifier: string;
  _id?: string;
  label?: string;
  key?: string;
  type?: string;
  reportType?: 'custom' | 'standard';
  route: string;
};

export const isReport = (item: any): item is Report => {
  return (item as Report).key !== undefined;
};
export const isCustomReport = (item: any): item is CustomReport => {
  return (item as CustomReport)._id !== undefined;
};

export type ReportType = 'standard-report' | 'custom-report' | 'report';
export type SelectedReport = {
  title: string;
  route: string;
  type: ReportType;
  resource: string;
};

export type ReportState = {
  customReports: CustomReport[];
  filteredCustomReports: CustomReport[];
  filteredReports: ReportWithSection[];
  searchedValue: string;
  selectedReport: SelectedReport | null;
  resourceColumns: any;
  columns: TColType[] | null;
  isColumnsLoading: boolean;
  favouriteReports: FavouriteReport[];
  favouritList: string[];
};

export type UseReportActions =
  | { type: 'setFavouriteReports'; payload: FavouriteReport[] }
  | { type: 'setCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredReports'; payload: ReportWithSection[] }
  | { type: 'setSelectedReport'; payload: SelectedReport | null }
  | { type: 'setSearchedValue'; payload: string }
  | { type: 'setResourceColumns'; payload: any }
  | { type: 'setColumns'; payload: TColType[] | null }
  | { type: 'setFavouritList'; payload: string[] }
  | { type: 'setIsColumnsLoading'; payload: boolean };

export type UseReport = ReturnType<typeof useReport>;

export type TableCommonProps = {
  state: UseReport;
  isSidebarOpen: boolean;
  isMobile: boolean;
};

export type ResourceColumn = {
  fieldData: FieldData;
  isCreate: boolean;
  isRead: boolean;
  isUpdate: boolean;
};
export type FieldData = {
  _id: string;
  fieldName: string;
  fieldLabel: string;
  required: boolean;
  type: string;
  sectionName: string;
  isTooltip: boolean;
  order: number;
  resource: string;
  editAble: boolean;
  primaryField?: boolean;
  defaultValue?: string;
  disableOnEdit?: boolean;
  hiddenField?: boolean;
  isDefaultValue?: boolean;
  isDropdown?: boolean;
  isUneditable?: boolean;
  isWarningTooltip?: boolean;
  lookup?: boolean;
  lookupResource?: string;
  unique?: boolean;
  warningTooltipMessage?: string;
  deletAble?: boolean;
  entityWiseLookup?: boolean;
  formula?: string;
  inputFields?: any[];
  formulaFields?: any[];
  formulainputFields?: any[];
  formulaoption?: any;
  brand: string;
  roleType: number;
  isColumnEditable?: boolean;
  isHideColumnSum?: boolean;
  isMinMaxValue?: boolean;
  isSystemGenerate?: boolean;
  maxValue?: number;
  maxValueServiceAdd?: string;
  minValue?: number;
  minValueServiceAdd?: string;
  systemGeneratedPrefix?: string;
  systemGeneratedAutoIncrement?: boolean;
  stopHideColumn?: boolean;
  sectionProperties: any;
  option?: Option[];
  tooltipMessage?: string;
  isShowFieldDependentOn?: boolean;
  addManualOptionInExcel?: boolean;
  addAdditionalOption?: boolean;
  addBulkOptions?: boolean;
  dataList?: boolean;
  dataListId?: string;
  isFieldEntityWise?: boolean;
  showInPdf?: boolean;
  lookupDependentOn?: string;
  lookupDependentOnField?: string;
  columnSize?: number;
  htmlDescription?: string;
  preFilters?: any[];
  subFields?: any[];
  visibilityCondition?: any[];
  lookupPreFilterFields?: any[];
  dateValidation?: any[];
  restrictBackDate?: boolean;
  restrictFutureDate?: boolean;
};
export type Option = {
  optionLabel: string;
  optionValue: string;
  order: number;
  default: boolean;
  id?: number;
};
