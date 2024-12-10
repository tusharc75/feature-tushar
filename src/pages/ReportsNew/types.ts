import useReport from 'src/pages/ReportsNew/useReport';

export type Report = {
  title: string;
  permission: string;
  key: string;
  type: string;
};
export type CustomReport = {
  _id?: string;
  brand?: string;
  customReportName?: string;
};

export type ReportState = {
  customReports: CustomReport[];
  filteredCustomReports: CustomReport[];
  filteredReports: Report[];
  searchedValue: string;
};

export type UseReportActions =
  | { type: 'setCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredCustomReports'; payload: CustomReport[] }
  | { type: 'setFilteredReports'; payload: Report[] }
  | { type: 'setSearchedValue'; payload: string };

export type UseReport = ReturnType<typeof useReport>;
