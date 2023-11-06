import { useReducer } from 'react';
import { gridPageSizes } from 'src/constants/helpers';

function reducer(state: TInitialState, action: TActios) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading
      };

    case 'initialize':
      return {
        ...state,
        error: false,
        dataRows: action.data,
        rowCount: action.count,
        selectedRecords: action.selectedRecords || []
      };

    case 'selection':
      return {
        ...state,
        selectedRecords: action.selectedRecords
      };

    case 'update':
      return {
        ...state,
        dataRows: action.data,
        loading: false
      };

    case 'filter':
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      };

    case 'sort':
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      };

    case 'search':
      return {
        ...state,
        search: action.search,
        loading: true
      };

    case 'pageChange':
      return {
        ...state,
        page: action.page
      };

    case 'pageSizeChange':
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true
      };
    case 'error':
      return {
        ...state,
        error: action.error
      };
    case 'complete':
      return {
        ...state,
        loading: false
      };
    case 'currentEditingCellPosition':
      return { ...state, currentEditingCellPosition: action.cellPosition };
    case 'showFilteredRecordsOnly':
      return { ...state, showFilteredRecordsOnly: !state.showFilteredRecordsOnly };

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: '',
  filters: {},
  sorting: [],
  selectedRecords: [],
  currentEditingCellPosition: null,
  error: false,
  showFilteredRecordsOnly: false
};

export type TInitialState = {
  dataRows: any[];
  rowCount: number;
  loading: boolean;
  page: number;
  limit: number;
  pageSizes: number[];
  search: string;
  filters: any;
  sorting: any[];
  selectedRecords: any[];
  currentEditingCellPosition: { rowId: string; columnName: string } | null;
  error: boolean;
  showFilteredRecordsOnly: boolean;
};
export type TActios =
  | { type: 'loading'; loading: boolean }
  | { type: 'initialize'; data: any[]; count: number; selectedRecords?: any[] }
  | { type: 'selection'; selectedRecords: any[] }
  | { type: 'update'; data: any[] }
  | { type: 'filter'; filters: any }
  | { type: 'sort'; sorting: any[] }
  | { type: 'search'; search: string }
  | { type: 'pageChange'; page: number }
  | { type: 'pageSizeChange'; limit: number }
  | { type: 'complete' }
  | { type: 'currentEditingCellPosition'; cellPosition: { rowId: string; columnName: string } | null }
  | { type: 'error'; error: boolean }
  | { type: 'showFilteredRecordsOnly'; showFilteredRecordsOnly: boolean };

export const useTableReducer = () => {
  const [state, dispatch] = useReducer(reducer, intialState);

  return { state, dispatch };
};
