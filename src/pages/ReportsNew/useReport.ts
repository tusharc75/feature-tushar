import { groupBy, kebabCase, uniqBy } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import routes from 'src/components/Helpers/Routes';
import { REPORT_LIST } from 'src/constants/helpers';
import { CustomReport, FavouriteReport, Report, ReportState, ReportWithSection, UseReportActions } from 'src/pages/ReportsNew/types';
import { createUserFavouriteObj, handleGetRoute } from 'src/pages/ReportsNew/utils';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';
import { useHistory, useLocation } from 'react-router-dom';

const initialState: ReportState = {
  customReports: [],
  filteredCustomReports: [],
  favouriteReports: [],
  filteredReports: [],
  searchedValue: '',
  selectedReport: null,
  resourceColumns: null,
  columns: null,
  isColumnsLoading: false,
  favouritList: []
};

const reducer = (state: ReportState, action: UseReportActions) => {
  switch (action.type) {
    case 'setCustomReports':
      return { ...state, customReports: action.payload };
    case 'setFilteredCustomReports':
      return { ...state, filteredCustomReports: action.payload };
    case 'setFilteredReports':
      return { ...state, filteredReports: action.payload };
    case 'setFavouriteReports':
      return { ...state, favouriteReports: action.payload };
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
    case 'setFavouritList':
      return { ...state, favouritList: action.payload };
    default:
      return state;
  }
};

const useReport = () => {
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;

  const {
    state: { permissions, selectedEntity, resources }
  } = useData();

  const reportList = useMemo(() => {
    return REPORT_LIST.filter((f) => permissions[f.permission]?.isRead).map((d) => ({
      ...d,
      label: d.type === 'dynamic' && resources[d.key]?.titlePlural ? resources[d.key]?.titlePlural : d.title,
      route: `/reports${d.type !== 'dynamic' ? `/${kebabCase(d.key)}/` + kebabCase(d.type) : routes[d.key]?.path}`
    }));
  }, [permissions, resources]);
  const data = useMemo(() => groupBy(reportList, 'section'), [reportList]);
  const reportListWithSections = useMemo(
    () =>
      Object.keys(data).map((key) => ({
        section: key,
        reports: data[key].map((d) => ({
          ...d
        }))
      })),
    [data]
  );

  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { customReports, selectedReport, favouriteReports, favouritList } = state;

  const setCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setCustomReports', payload }), []);
  const setFilteredCustomReports = useCallback((payload: CustomReport[]) => dispatch({ type: 'setFilteredCustomReports', payload }), []);
  const setFavouriteReports = useCallback((payload: FavouriteReport[]) => dispatch({ type: 'setFavouriteReports', payload }), []);
  const setFilteredReports = useCallback((payload: ReportWithSection[]) => dispatch({ type: 'setFilteredReports', payload }), []);
  const setResourceColumns = useCallback((payload: any[]) => dispatch({ type: 'setResourceColumns', payload }), []);
  const setColumns = useCallback((payload: TColType[] | null) => dispatch({ type: 'setColumns', payload }), []);
  const setIsColumnsLoading = useCallback((payload: boolean) => dispatch({ type: 'setIsColumnsLoading', payload }), []);
  const setFavouritList = useCallback((payload: string[]) => dispatch({ type: 'setFavouritList', payload }), []);

  const filterRecords = useCallback(
    (searchQuery = ''): ReportWithSection[] => {
      return reportListWithSections.map((d) => ({
        ...d,
        reports: d.reports.filter((f) => f.label.toLowerCase().includes(searchQuery))
      }));
    },
    [reportListWithSections]
  );

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
        history.push(payload.route);
      }
    },
    [setColumns, setResourceColumns, selectedReport?.route, setIsColumnsLoading, history]
  );

  const filterValues = useCallback(
    (searchedValue: string) => {
      const searchedFor = searchedValue.toLowerCase().trim();
      if (!searchedFor && searchedFor === '') {
        setFilteredReports(filterRecords(''));
        customReports.length && setFilteredCustomReports(customReports);
        return;
      }
      const filtered = filterRecords(searchedFor);
      setFilteredReports(filtered);
      setFilteredCustomReports(customReports.filter((f) => f.customReportName.toLowerCase().includes(searchedFor)));
    },
    [customReports, filterRecords, setFilteredCustomReports, setFilteredReports]
  );

  const setSearchedValue = useCallback(
    (payload: string) => {
      dispatch({ type: 'setSearchedValue', payload });
      filterValues(payload);
    },
    [filterValues]
  );

  useEffect(() => {
    const reports = filterRecords('');
    setFilteredReports(reports);
  }, [filterRecords, setFilteredReports]);

  const fetchCustomReports = useCallback(async () => {
    let {
      data: { data }
    } = await axiosInstance().get(`custom-report`);
    const customReports = data?.map((report) => ({ ...report, route: `/reports/custom-report/${report._id}`, label: report.customReportName }));
    setCustomReports(customReports);
    setFilteredCustomReports(customReports);
  }, [setCustomReports, setFilteredCustomReports]);

  const fetchFavourites = useCallback(() => {
    axiosInstance()
      .get(`/user/user-favourite-reports`)
      .then(({ data: { data } }) => {
        setFavouritList(data);
      });
  }, [setFavouritList]);

  const setUserFavourites = useCallback(
    (item: Report | CustomReport, set = true) => {
      const { name, obj } = createUserFavouriteObj(item);
      // optimistic update
      if (set) {
        setFavouriteReports([...favouriteReports, obj]);
      } else {
        setFavouriteReports(favouriteReports.filter((f) => f.identifier !== name));
      }
      axiosInstance()
        .put(`/user/user-favourite-reports`, {
          report: name,
          setFavourite: set
        })
        .then(() => {})
        .catch(() => {
          // revert optimistic update
          if (!set) {
            setFavouriteReports(uniqBy([...favouriteReports, obj], (d) => d.identifier));
          } else {
            setFavouriteReports(favouriteReports.filter((f) => f.identifier !== name));
          }
        });
    },
    [favouriteReports, setFavouriteReports]
  );

  const isFavourite = useCallback(
    (item: Report | CustomReport) => {
      const { name } = createUserFavouriteObj(item);
      return favouriteReports.some((f) => f.identifier === name);
    },
    [favouriteReports]
  );

  const createFavouriteItems = useCallback(() => {
    const userFav = reportList.filter((f) => favouritList.includes(f.label)).map((d) => createUserFavouriteObj(d).obj);
    customReports.filter((f) => favouritList.includes(f._id)).forEach((d) => userFav.push(createUserFavouriteObj(d).obj));
    setFavouriteReports(userFav);
  }, [customReports, favouritList, reportList, setFavouriteReports]);

  useEffect(() => {
    createFavouriteItems();
  }, [createFavouriteItems]);

  useEffect(() => {
    fetchCustomReports();
  }, [fetchCustomReports]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  useEffect(() => {
    filterValues(searchQuery);
  }, [searchQuery, filterValues]);

  // to sync with route
  useEffect(() => {
    if (selectedReport?.route !== pathname) {
      const currentRouteData = [...reportList, ...customReports].find((d) => d.route === pathname);
      if (currentRouteData) {
        const data = handleGetRoute({ route: currentRouteData.route, title: currentRouteData.label });
        dispatch({ type: 'setSelectedReport', payload: data });
        setIsColumnsLoading(true);
      }
    }
  }, [customReports, pathname, reportList, selectedReport?.route, setIsColumnsLoading]);

  return {
    ...state,
    resources,
    permissions,
    selectedEntity,
    setCustomReports,
    setFilteredCustomReports,
    setFilteredReports,
    setSearchedValue,
    setSelectedReport,
    setResourceColumns,
    setColumns,
    setIsColumnsLoading,
    setUserFavourites,
    isFavourite
  };
};

export default useReport;
