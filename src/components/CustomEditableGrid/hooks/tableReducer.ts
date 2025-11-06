import { useReducer } from 'react';

function reducer(state: TInitialState, action: TActios) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading
      };
    case 'setVisibleColumns':
      return {
        ...state,
        visibleColumns: action.visibleColumns
      };
    case 'setColumnOrder':
      return {
        ...state,
        columnOrder: typeof action.columnOrder === 'function' ? action.columnOrder(state.columnOrder) : action.columnOrder
      };
    default:
      break;
  }

  return state;
}

const intialState = {
  loading: false,
  visibleColumns: {},
  columnOrder: []
};

export type TInitialState = {
  loading: boolean;
  visibleColumns: { [key: string]: boolean };
  columnOrder: string[];
};

export type TActios =
  | { type: 'loading'; loading: boolean }
  | { type: 'setVisibleColumns'; visibleColumns: { [key: string]: boolean } }
  | { type: 'setColumnOrder'; columnOrder: ((data: string[]) => string[]) | string[] };

export const useTableReducer = () => {
  const [state, dispatch] = useReducer(reducer, intialState);

  return { state, dispatch };
};
