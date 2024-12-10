import React, { useCallback, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { REPORT_LIST } from 'src/constants/helpers';
import { CustomReport, ReportState, UseReportActions, Report } from 'src/pages/ReportsNew/types';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';

const initialState: ReportState = {
  customReports: [],
  filteredCustomReports: [],
  filteredReports: [],
  searchedValue: ''
};

const reducer = (state: ReportState, action: UseReportActions) => {
  switch (action.type) {
    case 'setCustomReports':
      return { ...state, customReports: action.payload };
    case 'setFilteredCustomReports':
      return { ...state, filteredCustomReports: action.payload };
    case 'setFilteredReports':
      return { ...state, filteredReports: action.payload };
    case 'setSearchedValue':
      return { ...state, searchedValue: action.payload };
    default:
      return state;
  }
};

const useReport = () => {
  const {
    state: { permissions }
  } = useData();

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { customReports } = state;

  const setCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setCustomReports', payload }), []);
  const setFilteredCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setFilteredCustomReports', payload }), []);
  const setFilteredReports = useCallback((payload: Report[]) => dispatch({ type: 'setFilteredReports', payload }), []);

  const filterValues = useCallback(
    (searchedValue: string) => {
      const searchedFor = searchedValue.toLowerCase().trim();
      if (!searchedFor && searchedFor === '') {
        setFilteredReports(REPORT_LIST.filter((report) => permissions[report.permission]?.isRead));
        customReports.length && setFilteredCustomReports(customReports);
        return;
      }
      const filtered = REPORT_LIST.filter((f) => f.title.toLowerCase().includes(searchedFor) && permissions[f.permission]?.isRead);
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
    const reports = REPORT_LIST.filter((report) => permissions[report.permission]?.isRead);
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
    setCustomReports,
    setFilteredCustomReports,
    setFilteredReports,
    setSearchedValue
  };
};

export default useReport;
