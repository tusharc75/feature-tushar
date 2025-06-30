import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { UseCardColActions, UseCardColState, UseCardColTimelineProps } from 'src/components/CardColTimeline1/types';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const getInitialState = <D, C extends readonly string[]>(): UseCardColState<D, C> => {
  return {
    columns: [] as unknown as C,
    visibleColumns: [] as unknown as C[number][],
    limit: 25,
    columnDef: [],
    filterQuery: '',
    refreshSignal: false,
    defaultVisibleRows: 3,
    order: null,
    visible: null,
    selectedView: null,
    selectedRecordObj: {},
    resetSelectionSignal: false
  };
};

const reducer = <D, C extends readonly string[]>(state: UseCardColState<D, C>, action: UseCardColActions<D, C>) => {
  switch (action.type) {
    case 'setStateData':
      return { ...state, ...action.payload } as UseCardColState<D, C>;
    case 'resetSelection':
      return { ...state, resetSelectionSignal: !state.resetSelectionSignal };
    case 'setSelectedRecordObj':
      return { ...state, selectedRecordObj: action.payload };
    case 'setColumns':
      return { ...state, columns: action.payload } as UseCardColState<D, C>;
    case 'setVisibleColumns':
      return { ...state, visibleColumns: action.payload } as UseCardColState<D, C>;
    case 'setSelectedView':
      return { ...state, selectedView: action.payload };
    case 'setColumnDef': {
      const payload = {
        ...state,
        columnDef: action.payload
      } as UseCardColState<D, C>;
      return payload;
    }
    case 'setRefreshSignal':
      return { ...state, refreshSignal: action.payload } as UseCardColState<D, C>;
    case 'setDefaultVisibleRows':
      return { ...state, defaultVisibleRows: action.payload } as UseCardColState<D, C>;
    case 'setLimit':
      return { ...state, limit: action.payload } as UseCardColState<D, C>;
  }
};

export const useCardColTimeline = <D, C extends readonly string[]>({
  columns,
  fetchSingleColumn,
  initialVisibleColumns,
  columnDef,
  keyGetter
}: UseCardColTimelineProps<D, C>) => {
  const initialState = useMemo(() => getInitialState<D, C>(), []);
  const [state, setState] = useReducer(reducer, initialState);

  const setColumns = useCallback((payload: UseCardColState<D, C>['columns']) => {
    setState({ type: 'setColumns', payload: payload });
  }, []);

  const setVisibleColumns = useCallback((payload: UseCardColState<D, C>['visibleColumns']) => {
    setState({ type: 'setVisibleColumns', payload });
  }, []);

  const setOrderAndVisibility = useCallback(
    ({ order = state.order, visible = state.visible }: { order: string[]; visible: Record<string, boolean> }) => {
      setState({ type: 'setStateData', payload: { order, visible } });
    },
    [state.order, state.visible]
  );

  const setSelectedView = useCallback((payload: UseCardColState<D, C>['selectedView']) => {
    setState({ type: 'setSelectedView', payload });
  }, []);

  const setLimit = useCallback((payload: UseCardColState<D, C>['limit']) => {
    setState({ type: 'setLimit', payload });
  }, []);
  const setDefaultVisibleRows = useCallback((payload: UseCardColState<D, C>['limit']) => {
    setState({ type: 'setDefaultVisibleRows', payload });
  }, []);
  const setColumnDef = useCallback((payload: UseCardColState<D, C>['columnDef']) => {
    const preparedColumnDef = prepareColumnDef(payload);
    setState({ type: 'setColumnDef', payload: preparedColumnDef });
  }, []);
  const setFilterQuery = useCallback(
    (payload: UseCardColState<D, C>['filterQuery']) => {
      setState({
        type: 'setStateData',
        payload: { filterQuery: payload, refreshSignal: !state.refreshSignal }
      });
    },
    [state.refreshSignal]
  );

  const resetSelection = () => {
    setState({ type: 'setSelectedRecordObj', payload: {} });
    setState({ type: 'resetSelection' });
  };

  const refreshAllColumns = useCallback(() => {
    setState({ type: 'setRefreshSignal', payload: !state.refreshSignal });
  }, [state.refreshSignal]);

  useEffect(() => {
    const payload = {
      visibleColumns: initialVisibleColumns,
      columns: columns
    };
    if (columnDef) {
      payload['columnDef'] = prepareColumnDef(columnDef);
    }
    setState({
      type: 'setStateData',
      payload
    });
  }, [columnDef, columns, initialVisibleColumns]);

  const selectedRecords = useMemo(() => {
    const data = Object.values(state.selectedRecordObj).flat() as D[];
    return data;
  }, [state.selectedRecordObj]);

  return {
    ...state,
    setColumns,
    setVisibleColumns,
    refreshAllColumns,
    setLimit,
    setColumnDef,
    setDefaultVisibleRows,
    setFilterQuery,
    keyGetter,
    fetchSingleColumn,
    setState,
    setOrderAndVisibility,
    setSelectedView,
    resetSelection,
    selectedRecords
  };
};
const prepareColumnDef = (columnDef: TColType[]) => {
  return columnDef?.map((c) => ({
    ...c,
    id: c.accessor || c.id,
    size: c.width || c.size || 200,
    width: c.width || c.size || 200
  }));
};
