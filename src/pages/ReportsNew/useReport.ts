import { groupBy } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { REPORT_LIST_WITH_SECTIONS, REPORT_LIST } from 'src/constants/helpers';
import { CustomReport, ReportState, UseReportActions, Report } from 'src/pages/ReportsNew/types';
import { handleGetRoute } from 'src/pages/ReportsNew/utils';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';

const initialState: ReportState = {
  customReports: [],
  filteredCustomReports: [],
  filteredReports: [],
  searchedValue: '',
  selectedReport: null,
  resourceColumns: null,
  columns: null,
  isColumnsLoading: false
};

const reducer = (state: ReportState, action: UseReportActions) => {
  switch (action.type) {
    case 'setCustomReports':
      return { ...state, customReports: action.payload };
    case 'setFilteredCustomReports':
      return { ...state, filteredCustomReports: action.payload };
    case 'setFilteredReports':
      return { ...state, filteredReports: action.payload };
    case 'setSelectedReport':
      return { ...state, selectedReport: action.payload };
    case 'setSearchedValue':
      return { ...state, searchedValue: action.payload };
    case 'setResourceColumns':
      return { ...state, resourceColumns: action.payload };
    case 'setColumns':
      return { ...state, columns: action.payload };
    case 'setIsColumnsLoading':
      return { ...state, isColumnsLoading: action.payload };
    default:
      return state;
  }
};

const data = groupBy(REPORT_LIST, 'section');
const reportListWithSections = Object.keys(data).map((key) => ({
  section: key,
  reports: data[key]
}));

const filterRecords = (searchQuery = '', permissions: any): Report[] => {
  return reportListWithSections.map((d) => ({
    ...d,
    reports: d.reports.filter((f) => f.title.toLowerCase().includes(searchQuery) && permissions[f.permission]?.isRead)
  }));
};

const useReport = () => {
  const {
    state: { permissions, selectedEntity }
  } = useData();

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { customReports, selectedReport } = state;

  const setCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setCustomReports', payload }), []);
  const setFilteredCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setFilteredCustomReports', payload }), []);
  const setFilteredReports = useCallback((payload: Report[]) => dispatch({ type: 'setFilteredReports', payload }), []);
  const setResourceColumns = useCallback((payload: any[]) => dispatch({ type: 'setResourceColumns', payload }), []);
  const setColumns = useCallback((payload: TColType[] | null) => dispatch({ type: 'setColumns', payload }), []);
  const setIsColumnsLoading = useCallback((payload: boolean) => dispatch({ type: 'setIsColumnsLoading', payload }), []);

  const setSelectedReport = useCallback(
    (payload: { title: string; route: string }) => {
      setColumns(null);
      setResourceColumns(null);
      if (selectedReport?.route === payload.route) {
        dispatch({ type: 'setSelectedReport', payload: null });
      } else {
        const data = handleGetRoute(payload);
        dispatch({ type: 'setSelectedReport', payload: data });
        setIsColumnsLoading(true);
      }
    },
    [setColumns, setResourceColumns, selectedReport?.route, setIsColumnsLoading]
  );

  const filterValues = useCallback(
    (searchedValue: string) => {
      const searchedFor = searchedValue.toLowerCase().trim();
      if (!searchedFor && searchedFor === '') {
        setFilteredReports(filterRecords('', permissions));
        customReports.length && setFilteredCustomReports(customReports);
        return;
      }
      const filtered = filterRecords(searchedFor, permissions);
      setFilteredReports(filtered);
      setFilteredCustomReports(customReports.filter((f) => f.customReportName.toLowerCase().includes(searchedFor)));
    },
    [customReports, permissions, setFilteredCustomReports, setFilteredReports]
  );

  const setSearchedValue = useCallback(
    (payload: string) => {
      dispatch({ type: 'setSearchedValue', payload });
      filterValues(payload);
    },
    [filterValues]
  );

  useEffect(() => {
    const reports = filterRecords('', permissions);
    setFilteredReports(reports);
  }, [permissions, setFilteredReports]);

  useEffect(() => {
    (async () => {
      let {
        data: { data }
      } = await axiosInstance().get(`custom-report`);
      setCustomReports(data);
      setFilteredCustomReports(data);
    })();
  }, [setCustomReports, setFilteredCustomReports]);

  useEffect(() => {
    filterValues(searchQuery);
  }, [searchQuery, filterValues]);

  return {
    ...state,
    permissions,
    selectedEntity,
    setCustomReports,
    setFilteredCustomReports,
    setFilteredReports,
    setSearchedValue,
    setSelectedReport,
    setResourceColumns,
    setColumns,
    setIsColumnsLoading
  };
};

export default useReport;
