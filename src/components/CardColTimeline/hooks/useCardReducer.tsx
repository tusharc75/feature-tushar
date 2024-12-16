import { useReducer } from 'react';
import { datarowInterface } from '../';

const getInitialState = (columns) => {
  const loading = {};
  const page = {};
  for (const column of columns) {
    loading[column] = false;
    page[column] = 0;
  }
  return { loading, page };
};

function reducer(state: TInitialState, action: TActios) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading(state.loading)
      };
    case 'initialize':
      const { loading, page } = getInitialState(action.columnOrder);
      return {
        ...state,
        columnOrder: action.columnOrder,
        visibleColumns: action.visibleColumns,
        rowDef: action.rowDef,
        limit: action.limit ?? 25,
        loading: loading,
        page: page
      };
    case 'page':
      return {
        ...state,
        page: action.setPage(state.page)
      };
    case 'columnOrder':
      return {
        ...state,
        columnOrder: action.columnOrder
      };
    case 'setFilterQuery':
      const { loading: resetedLoading } = getInitialState(state.columnOrder);
      return {
        ...state,
        data: action.filterQuery !== state.filterQuery ? {} : state.data,
        filterQuery: action.filterQuery,
        loading: resetedLoading,
        page: 0
      };
    case 'setData':
      return {
        ...state,
        data: action.setData(state.data),
        count: action.setCount(state.count)
      };
    case 'selection':
      return {
        ...state,
        selectedRecords: action.selectedRecords
      };
    case 'visibleColumns':
      return {
        ...state,
        visibleColumns: action.visibleColumns
      };
    case 'limit':
      return {
        ...state,
        limit: action.limit
      };
    case 'refreshData':
      return {
        ...state,
        refreshDataCount: state.refreshDataCount < 10 ? state.refreshDataCount + 1 : 0,
        data: {},
        selectedRecords: [],
        loading: {}
      };
    case 'reset':
      return {
        data: {},
        count: {},
        loading: {},
        page: {},
        selectedRecords: [],
        columnOrder: [],
        visibleColumns: [],
        filterQuery: '',
        rowDef: [],
        limit: 25,
        refreshDataCount: 0
      };
    default:
      break;
  }

  return state;
}

const intialState = {
  data: {},
  count: {},
  loading: {},
  page: {},
  selectedRecords: [],
  columnOrder: [],
  visibleColumns: [],
  filterQuery: '',
  rowDef: [],
  limit: 25,
  refreshDataCount: 0
};

export type TInitialState = {
  data: { [key: string]: any[] };
  count: { [key: string]: number };
  loading: { [key: string]: boolean };
  columnOrder: string[];
  page: { [key: string]: number };
  selectedRecords: any[];
  visibleColumns: string[];
  filterQuery: string;
  rowDef: datarowInterface[];
  limit: number;
  refreshDataCount: number;
};

export type TActios =
  | { type: 'initialize'; columnOrder: string[]; visibleColumns: string[]; rowDef: datarowInterface[]; limit?: number }
  | { type: 'selection'; selectedRecords: any[] }
  | { type: 'loading'; loading: (prev: { [key: string]: boolean }) => { [key: string]: boolean } }
  | { type: 'page'; setPage: (data: { [key: string]: number }) => { [key: string]: number } }
  | { type: 'columnOrder'; columnOrder: string[] }
  | { type: 'setFilterQuery'; filterQuery: string; loading?: boolean }
  | {
      type: 'setData';
      setData: (data: { [key: string]: any[] }) => { [key: string]: any[] };
      setCount: (data: { [key: string]: number }) => { [key: string]: number };
    }
  | { type: 'visibleColumns'; visibleColumns: string[] }
  | { type: 'limit'; limit: number }
  | { type: 'refreshData' }
  | { type: 'reset' };

export const useCardReducer = () => {
  const [state, dispatch] = useReducer(reducer, intialState);

  return { state, dispatch };
};
