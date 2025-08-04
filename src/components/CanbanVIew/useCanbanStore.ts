import { useCallback, useMemo, useReducer } from 'react';
import { Actions, CanbanViewState } from 'src/components/CanbanVIew/types';

const getInitialState = () => {
  return {
    search: '',
    selectedRrowsMap: new Map<string, any>()
  } as CanbanViewState;
};

const reducer = (state: CanbanViewState, action: Actions): CanbanViewState => {
  switch (action.type) {
    case 'setSearch':
      return { ...state, search: action.payload };
    case 'setSelectedRrowsMap': {
      return { ...state, selectedRrowsMap: action.payload };
    }
    default:
      return state;
  }
};

export const useCanbanStore = () => {
  const [state, setState] = useReducer(reducer, {}, getInitialState);

  const selectedRows = useMemo(() => {
    return Array.from(state.selectedRrowsMap.values());
  }, [state.selectedRrowsMap]);

  const handleSelect = useCallback(
    (data: any) => {
      const payload = new Map(state.selectedRrowsMap);
      if (state.selectedRrowsMap.has(data._id)) {
        payload.delete(data._id);
      } else {
        payload.set(data._id, data);
      }
      setState({ type: 'setSelectedRrowsMap', payload });
    },
    [state.selectedRrowsMap]
  );

  const handleOnDelete = useCallback(
    (data: any) => {
      if (state.selectedRrowsMap.has(data._id)) {
        const payload = new Map(state.selectedRrowsMap);
        payload.delete(data._id);
        setState({ type: 'setSelectedRrowsMap', payload });
      }
    },
    [state.selectedRrowsMap]
  );

  const handleClearSelection = useCallback(() => {
    setState({ type: 'setSelectedRrowsMap', payload: new Map() });
  }, []);

  return {
    ...state,
    selectedRows,
    handleSelect,
    handleOnDelete,
    handleClearSelection
  };
};
