import axios, { CancelToken } from 'axios';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { UseCardColActions, UseCardColState, UseCardColTimelineProps } from 'src/components/CardColTimeline1/types';

const getInitialState = <D, C extends readonly string[]>(): UseCardColState<D, C> => {
  return {
    data: {} as Partial<Record<C[number], D[]>>,
    columns: [] as unknown as C,
    visibleColumns: [] as unknown as C[number][],
    selectedRecordsObj: {} as unknown as Record<C[number], Record<string, boolean>>,
    count: {} as Record<C[number], number>,
    loading: {} as Record<C[number], boolean>,
    page: {} as Record<C[number], number>,
    limit: 25,
    columnDef: [],
    filterQuery: '',
    refreshSignal: false,
    defaultVisibleRows: 3
  };
};

const reducer = <D, C extends readonly string[]>(state: UseCardColState<D, C>, action: UseCardColActions<D, C>) => {
  switch (action.type) {
    case 'setStateData': {
      // console.log(state, action.payload, 'data' in action.payload);
      return { ...state, ...action.payload } as UseCardColState<D, C>;
    }
    case 'setData':
      return { ...state, data: action.payload } as UseCardColState<D, C>;
    case 'setColumns':
      return { ...state, columns: action.payload } as UseCardColState<D, C>;
    case 'setVisibleColumns':
      return { ...state, visibleColumns: action.payload } as UseCardColState<D, C>;
    case 'setSelectedRecordsObj':
      return { ...state, selectedRecordsObj: action.payload } as UseCardColState<D, C>;
    case 'setLoading':
      return { ...state, loading: action.payload } as UseCardColState<D, C>;
    case 'setColumnDef':
      return { ...state, columnDef: action.payload } as UseCardColState<D, C>;
    case 'setRefreshSignal':
      return { ...state, refreshSignal: action.payload } as UseCardColState<D, C>;
    case 'setDefaultVisibleRows':
      return { ...state, defaultVisibleRows: action.payload } as UseCardColState<D, C>;
    case 'setLimit':
      return { ...state, limit: action.payload } as UseCardColState<D, C>;
  }
};
let initialCache: any = { data: {}, page: {}, loading: {}, count: {}, selectedRecordsObj: {} };

export const useCardColTimeline = <D, C extends readonly string[]>({
  columns,
  fetchSingleColumn,
  initialVisibleColumns,
  columnDef,
  keyGetter
}: UseCardColTimelineProps<D, C>) => {
  const initialState = useMemo(() => getInitialState<D, C>(), []);
  const [state, setState] = useReducer(reducer, initialState);
  const firstRender = useRef(true);
  const cache = useRef({ data: {}, page: {}, loading: {}, count: {}, selectedRecordsObj: {} });

  const initialize = useCallback(() => {
    const selectedRecordsObj = {};
    const data = {};
    const count = {};
    const page = {};
    const loading = {};
    for (const column of columns) {
      selectedRecordsObj[column] = {};
      data[column] = null;
      count[column] = null;
      page[column] = 0;
      loading[column] = null;
    }
    const payload = {
      visibleColumns: initialVisibleColumns,
      columns: columns,
      selectedRecordsObj,
      data,
      count,
      page,
      loading
    };
    cache.current = {
      selectedRecordsObj,
      data: payload.data,
      page: payload.page,
      loading: payload.loading,
      count: payload.count
    };
    initialCache = cache.current;
    if (columnDef) {
      payload['columnDef'] = columnDef;
    }
    setState({
      type: 'setStateData',
      payload
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnDef, columns]);

  const resetCache = () => {
    cache.current = initialCache;
  };

  const setStateCache = () => {
    cache.current = {
      count: state.count,
      data: state.data,
      loading: state.loading,
      page: state.page,
      selectedRecordsObj: state.selectedRecordsObj
    };
  };

  const setData = useCallback(
    ({
      column,
      data,
      page,
      count,
      pushData = false
    }: {
      column: UseCardColState<D, C>['columns'][number];
      data: D[];
      page: number;
      count?: number;
      pushData?: boolean;
    }) => {
      const payload = {
        data: { ...state.data },
        page: { ...state.page, [column]: page },
        loading: { ...state.loading, [column]: false }
      };
      if (pushData) {
        payload['data'][column] = [...(payload['data'][column] || []), ...data];
      } else {
        payload['data'][column] = [...data];
      }
      if (typeof count === 'number') {
        payload['count'] = { ...state.count, [column]: count };
      } else {
        payload['count'] = { ...state.count };
      }
      setState({
        type: 'setStateData',
        payload
      });
    },
    [state.count, state.data, state.loading, state.page]
  );

  const setColumns = useCallback((payload: UseCardColState<D, C>['columns']) => {
    setState({ type: 'setColumns', payload: payload });
  }, []);

  const setVisibleColumns = useCallback((payload: UseCardColState<D, C>['visibleColumns']) => {
    setState({ type: 'setVisibleColumns', payload });
  }, []);

  const handleSelect = useCallback(
    (id: string, column: UseCardColState<D, C>['columns'][number]) => {
      const prevSelectedRecords = { ...state.selectedRecordsObj[column] };
      prevSelectedRecords[id] = !prevSelectedRecords[id];
      const newObj: Record<string, boolean> = {};
      for (const key in prevSelectedRecords) {
        if (prevSelectedRecords[key]) {
          newObj[key] = true;
        }
      }
      if (state.selectedRecordsObj[column]) {
        setState({ type: 'setSelectedRecordsObj', payload: { ...state.selectedRecordsObj, [column]: newObj } });
      } else {
        setState({ type: 'setSelectedRecordsObj', payload: { [column]: newObj } });
      }
    },
    [state.selectedRecordsObj]
  );

  const handleSelectAll = useCallback(
    (column: UseCardColState<D, C>['columns'][number]) => {
      const prevSelectedRecords = { ...state.selectedRecordsObj[column] };
      const ids = Object.keys(prevSelectedRecords);
      // All selected
      if (ids.length === state.data?.[column]?.length) {
        setState({ type: 'setSelectedRecordsObj', payload: { ...state.selectedRecordsObj, [column]: {} } });
      } else {
        const newObj: Record<string, boolean> = {};
        state.data?.[column]?.forEach((d) => {
          newObj[keyGetter(d as D)] = true;
        });
        setState({ type: 'setSelectedRecordsObj', payload: { ...state.selectedRecordsObj, [column]: newObj } });
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.selectedRecordsObj, state.data]
  );

  const setLoading = ({ column, loading }: { column: UseCardColState<D, C>['columns'][number]; loading: boolean }) => {
    setState({ type: 'setLoading', payload: { ...state.loading, [column]: loading } });
  };
  const setLimit = useCallback((payload: UseCardColState<D, C>['limit']) => {
    setState({ type: 'setLimit', payload });
  }, []);
  const setDefaultVisibleRows = useCallback((payload: UseCardColState<D, C>['limit']) => {
    setState({ type: 'setDefaultVisibleRows', payload });
  }, []);
  const setColumnDef = useCallback((payload: UseCardColState<D, C>['columnDef']) => {
    setState({ type: 'setColumnDef', payload });
  }, []);
  const setFilterQuery = useCallback((payload: UseCardColState<D, C>['filterQuery']) => {
    setState({
      type: 'setStateData',
      payload: { filterQuery: payload, selectedRecordsObj: {} }
    });
  }, []);
  const refreshAllColumns = useCallback(() => {
    setState({ type: 'setRefreshSignal', payload: !state.refreshSignal });
  }, [state.refreshSignal]);

  const resetSelection = useCallback(() => {
    setState({ type: 'setSelectedRecordsObj', payload: cache.current.selectedRecordsObj });
  }, []);

  const handleFetchSingleColumnWrapper = async (
    column: UseCardColState<D, C>['columns'][number],
    page = state.page[column],
    cancelToken?: CancelToken
  ) => {
    try {
      setLoading({ column, loading: true });
      const { data, count } = await fetchSingleColumn({ column, filterQuery: state.filterQuery, page, limit: state.limit, cancelToken });
      setData({ column, data, page, count, pushData: page > 0 });
    } catch (error) {
      console.error(error);
      setLoading({ column, loading: false });
    }
  };

  const fetchSingleColumnInitialData = async (column: UseCardColState<D, C>['columns'][number], cancelToken: CancelToken) => {
    try {
      const { data, count } = await fetchSingleColumn({
        column,
        filterQuery: state.filterQuery,
        page: 0,
        limit: state.limit,
        cancelToken
      });
      const payload = {
        data: { ...cache.current.data, [column]: data },
        page: { ...cache.current.page, [column]: 0 },
        loading: { ...cache.current.loading, [column]: false },
        count: { ...cache.current.count, [column]: count },
        selectedRecordsObj: cache.current.selectedRecordsObj
      };
      cache.current = payload;
      setState({ type: 'setStateData', payload: cache.current });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllInitialColumnData = (cancelToken: CancelToken) => {
    for (const column of state.visibleColumns) {
      fetchSingleColumnInitialData(column, cancelToken);
    }
  };

  useEffect(() => {
    if (Object.keys(cache.current.data).length === 0) return;
    const condition = state.visibleColumns?.every((c) => {
      if (cache.current.data[c] && state.data[c]) {
        return true;
      } else {
        return false;
      }
    });
    if (condition) {
      resetCache();
    } else {
    }
  }, [state.data, state.visibleColumns]);

  // fetch data only for new columns
  useEffect(() => {
    const tokenSource = axios.CancelToken.source();
    firstRender.current = false;
    if (state.visibleColumns.length > 0) {
      fetchAllInitialColumnData(tokenSource.token);
    }
    return () => {
      tokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.visibleColumns]);

  // fetch data only on refesh signal
  useEffect(() => {
    const tokenSource = axios.CancelToken.source();
    console.log('hi', firstRender.current);
    if (firstRender.current) return;

    if (state.visibleColumns.length > 0) {
      setState({
        type: 'setStateData',
        payload: { ...cache.current }
      });
      fetchAllInitialColumnData(tokenSource.token);
    }

    return () => {
      tokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.refreshSignal]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedRecords = useMemo(() => {
    const selectedRows: string[] = [];
    columns.forEach((c) => {
      const data = state.selectedRecordsObj[c];
      if (data) {
        selectedRows.push(...Object.keys(data));
      }
    });
    return selectedRows;
  }, [columns, state.selectedRecordsObj]);

  const isAllSelected = useCallback(
    (column: UseCardColState<D, C>['columns'][number]) => {
      const prevSelectedRecords = { ...state.selectedRecordsObj[column] };
      const ids = Object.keys(prevSelectedRecords);
      return ids.length === state.data?.[column]?.length;
    },
    [state.data, state.selectedRecordsObj]
  );

  return {
    ...state,
    selectedRecords,
    handleFetchSingleColumnWrapper,
    setData,
    setColumns,
    setVisibleColumns,
    handleSelect,
    setLoading,
    refreshAllColumns,
    setLimit,
    setColumnDef,
    setDefaultVisibleRows,
    setFilterQuery,
    handleSelectAll,
    keyGetter,
    fetchSingleColumn,
    isAllSelected,
    setState,
    resetSelection
  };
};
