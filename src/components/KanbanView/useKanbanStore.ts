import { Reducer, useCallback, useMemo, useReducer } from 'react';
import { ActionPayloadMap, Actions, CanbanViewState, UseCanbanStore } from 'src/components/KanbanView/types';
import { prepareDeepFilters, prepareFilterByIds } from 'src/components/KanbanView/utils';

const getInitialState = <D>() => {
  return {
    search: '',
    selectedRrowsMap: new Map<string, any>(),
    deepFilters: [],
    deepFiltersOriginal: [],
    filterByIds: [],
    filterByIdsOriginal: [],
    filterTerm: {},
    resourceColumns: []
  } as CanbanViewState<D>;
};

const reducer = <D>(state: CanbanViewState<D>, action: Actions<D>): CanbanViewState<D> => {
  switch (action.type) {
    case 'setSearch':
      return { ...state, search: action.payload };
    case 'setSelectedRrowsMap': {
      return { ...state, selectedRrowsMap: action.payload };
    }
    case 'setDeepFilters': {
      return { ...state, deepFilters: action.payload };
    }
    case 'setDeepFiltersOriginal': {
      const newDeepFilters = prepareDeepFilters(action.payload, state.filterTerm);
      return { ...state, deepFiltersOriginal: action.payload, deepFilters: newDeepFilters };
    }
    case 'setFilterByIdsOriginal': {
      const newFilterByIds = prepareFilterByIds(action.payload, state.filterTerm);
      return { ...state, filterByIdsOriginal: action.payload, filterByIds: newFilterByIds };
    }
    case 'setFilterByIds': {
      return { ...state, filterByIds: action.payload };
    }
    case 'setFilterTerm': {
      const newDeepFilters = prepareDeepFilters(state.deepFiltersOriginal, action.payload);
      const newFilterByIds = prepareFilterByIds(state.filterByIdsOriginal, action.payload);
      return { ...state, filterTerm: action.payload, deepFilters: newDeepFilters, filterByIds: newFilterByIds };
    }
    case 'setResourceColumns': {
      return { ...state, resourceColumns: action.payload };
    }
    default:
      return state;
  }
};

export const useCanbanStore = <D>(): UseCanbanStore<D> => {
  const [state, dispatch] = useReducer<Reducer<CanbanViewState<D>, Actions<D>>, void>(reducer, undefined, () => getInitialState<D>());

  console.log(state);

  const selectedRows = useMemo(() => {
    return Array.from(state.selectedRrowsMap.values());
  }, [state.selectedRrowsMap]);

  const setState = useCallback(
    <K extends keyof ActionPayloadMap<D>>(type: K, payload: ActionPayloadMap<D>[K]) => {
      dispatch({ type, payload } as Actions<D>);
    },
    [dispatch]
  );

  const handleSelect = useCallback(
    (data: D) => {
      const payload = new Map(state.selectedRrowsMap);
      if (state.selectedRrowsMap.has(data['_id'])) {
        payload.delete(data['_id']);
      } else {
        payload.set(data['_id'], data);
      }
      dispatch({ type: 'setSelectedRrowsMap', payload });
    },
    [state.selectedRrowsMap]
  );

  const handleSelectMultiple = useCallback(
    (rows: D[]) => {
      if (!rows || rows?.length === 0) return;
      const payload = new Map(state.selectedRrowsMap);
      for (const data of rows) {
        payload.set(data['_id'], data);
      }
      dispatch({ type: 'setSelectedRrowsMap', payload });
    },
    [state.selectedRrowsMap]
  );

  const handleUnSelectMultiple = useCallback(
    (rows: D[]) => {
      if (!rows || rows?.length === 0) return;
      const payload = new Map(state.selectedRrowsMap);
      for (const data of rows) {
        payload.delete(data['_id']);
      }
      dispatch({ type: 'setSelectedRrowsMap', payload });
    },
    [state.selectedRrowsMap]
  );

  const handleOnDelete = useCallback(
    (data: D) => {
      if (state.selectedRrowsMap.has(data['_id'])) {
        const payload = new Map(state.selectedRrowsMap);
        payload.delete(data['_id']);
        dispatch({ type: 'setSelectedRrowsMap', payload });
      }
    },
    [state.selectedRrowsMap]
  );

  const handleClearSelection = useCallback(() => {
    dispatch({ type: 'setSelectedRrowsMap', payload: new Map() });
  }, []);

  return {
    ...state,
    selectedRows,
    setState,
    dispatch,
    handleSelectMultiple,
    handleUnSelectMultiple,
    handleSelect,
    handleOnDelete,
    handleClearSelection
  };
};
