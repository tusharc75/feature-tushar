import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import useReport from 'src/pages/ReportsNew/useReport';

export type Report = {
  section: string;
  reports: {
    title?: string;
    permission?: string;
    key?: string;
    type?: string;
  }[];
};
export type CustomReport = {
  _id?: string;
  brand?: string;
  customReportName?: string;
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
  filteredReports: Report[];
  searchedValue: string;
  selectedReport: SelectedReport | null;
  resourceColumns: any;
  columns: TColType[] | null;
  isColumnsLoading: boolean;
};

export type UseReportActions =
  | { type: 'setCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredReports'; payload: Report[] }
  | { type: 'setSelectedReport'; payload: SelectedReport | null }
  | { type: 'setSearchedValue'; payload: string }
  | { type: 'setResourceColumns'; payload: any }
  | { type: 'setColumns'; payload: TColType[] | null }
  | { type: 'setIsColumnsLoading'; payload: boolean };

export type UseReport = ReturnType<typeof useReport>;

export type TableCommonProps = {
  state: UseReport;
  isSidebarOpen: boolean;
  isMobile: boolean;
};
