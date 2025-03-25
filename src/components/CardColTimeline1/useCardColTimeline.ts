import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { InitProps, UseCardColActions, UseCardColState, UseCardReducerProps } from 'src/components/CardColTimeline1/types';

const getInitialState = <D, C extends readonly string[]>(): UseCardColState<D, C> => {
  return {
    data: {} as Partial<Record<C[number], D[]>>,
    columns: [] as unknown as C,
    visibleColumns: [] as unknown as C[number][],
    selectedRecordsObj: {},
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
    case 'setStateData':
      return { ...state, ...action.payload } as UseCardColState<D, C>;
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

export const useCardColTimeline = <D, C extends readonly string[]>() => {
  const initialState = useMemo(() => getInitialState<D, C>(), []);
  const [state, setState] = useReducer(reducer, initialState);

  const initialize = useCallback(({ columns, fetchSingleColumn, initialVisibleColumns, columnDef }: InitProps<D, C>) => {
    const payload = {
      visibleColumns: initialVisibleColumns,
      columns: columns
    };
    if (columnDef) {
      payload['columnDef'] = columnDef;
    }
    setState({
      type: 'setStateData',
      payload
    });
  }, []);

  const setData = ({
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
      data: { ...state.data, [column]: pushData ? [...(state.data[column] as D[]), ...data] : data },
      page: { ...state.page, [column]: page },
      loading: { ...state.loading, [column]: false }
    };
    if (typeof count === 'number') {
      payload['count'] = { ...state.count, [column]: count };
    }
    setState({
      type: 'setStateData',
      payload
    });
  };

  const setColumns = useCallback((payload: UseCardColState<D, C>['columns']) => {
    setState({ type: 'setColumns', payload: payload });
  }, []);

  const setVisibleColumns = useCallback((payload: UseCardColState<D, C>['visibleColumns']) => {
    setState({ type: 'setVisibleColumns', payload });
  }, []);
  const handleSelect = useCallback(
    (id: string) => {
      const prevSelectedRecords = { ...state.selectedRecordsObj };
      prevSelectedRecords[id] = !prevSelectedRecords[id];
      const newObj: Record<string, boolean> = {};
      for (const key in prevSelectedRecords) {
        if (prevSelectedRecords[key]) {
          newObj[key] = true;
        }
      }
      setState({ type: 'setSelectedRecordsObj', payload: newObj });
    },
    [state.selectedRecordsObj]
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
  const setFilterQuery = useCallback(
    (payload: UseCardColState<D, C>['filterQuery']) => {
      setState({
        type: 'setStateData',
        payload: { filterQuery: payload, ...createLoadingAndPageState(columns, true), data: undefined, selectedRecordsObj: {} }
      });
    },
    [columns]
  );
  const refreshAllColumns = useCallback(() => {
    setState({ type: 'setRefreshSignal', payload: !state.refreshSignal });
  }, [state.refreshSignal]);

  const handleFetchSingleColumnWrapper = async (column: UseCardColState<D, C>['columns'][number], page = state.page[column]) => {
    try {
      setLoading({ column, loading: true });
      const { data, count } = await fetchSingleColumn({ column, filterQuery: state.filterQuery, page, limit: state.limit });
      if (page === 0) {
        setData({ column, data, page, count, pushData: false });
      } else {
        setData({ column, data, page, count, pushData: true });
      }
    } catch (error) {
      console.error(error);
      setLoading({ column, loading: false });
    }
  };

  useEffect(() => {
    if (state.visibleColumns.length > 0) {
      setState({
        type: 'setStateData',
        payload: { ...createLoadingAndPageState(columns, true), data: undefined, selectedRecordsObj: {} }
      });
      state.visibleColumns.forEach((c) => handleFetchSingleColumnWrapper(c, 0));
    }
  }, [state.visibleColumns, state.refreshSignal]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedRecords = useMemo(() => {
    return Object.keys(state.selectedRecordsObj).filter((d) => d);
  }, [state.selectedRecordsObj]);

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
    setState
  };
};

const createLoadingAndPageState = <C extends readonly string[]>(columns: C, loadingState = false) => {
  const loading: Record<string, boolean> = {};
  const page: Record<string, number> = {};
  for (const column of columns) {
    loading[column] = loadingState;
    page[column] = 0;
  }
  return { loading, page } as {
    loading: Record<C[number], boolean>;
    page: Record<C[number], number>;
  };
};
