import { Table } from '@tanstack/react-table';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { gridPageSizes } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

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
        initialDataLoaded: true
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
    case 'onlyFilter':
      return {
        ...state,
        filters: action.filters
      };
    case 'filter':
      return {
        ...state,
        loading: action.loading ?? true,
        filters: action.filters,
        page: 0
      };
    case 'sort':
      return {
        ...state,
        sorting: action.sorting,
        loading: action.loading ?? true
      };
    case 'search':
      return {
        ...state,
        search: action.search,
        loading: false
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
        loading: action.loading ?? true
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

    case 'showFilteredRecordsOnly':
      return {
        ...state,
        showFilteredRecordsOnly: !state.showFilteredRecordsOnly
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
    case 'setColumnSizes': {
      return {
        ...state,
        sizes: action.sizes
      };
    }
    case 'setCustomExpanderRowData':
      return {
        ...state,
        customExpanderRowData: action.data
      };

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
  limit: gridPageSizes[0],
  pageSizes: gridPageSizes,
  search: '',
  filters: {},
  sorting: [],
  selectedRecords: [],
  error: false,
  showFilteredRecordsOnly: false,
  loadingExpanderRowId: null,
  initialDataLoaded: false,
  visibleColumns: {},
  columnOrder: [],
  sizes: null,
  customExpanderRowData: null
};

export type TInitialState = {
  dataRows: any[] | null;
  rowCount: number;
  loading: boolean;
  page: number;
  limit: number;
  pageSizes: number[];
  search: string;
  filters: any;
  sorting: any[];
  selectedRecords: any[];
  error: boolean;
  showFilteredRecordsOnly: boolean;
  initialDataLoaded: boolean;
  visibleColumns: { [key: string]: boolean };
  columnOrder: string[];
  sizes: { [key: string]: number } | null;
  customExpanderRowData: { [key: string]: boolean } | null | 'all';
};

export type ExtendedTInitialState = {
  setSelectedSubItemsMap: React.Dispatch<React.SetStateAction<Map<string, Map<string, any>>>>;
  selectedSubItemsMap: Map<string, Map<string, any>>;
  selectedCustomSubRows: any[];
  getTable: () => Table<any>;
  setTable: (table: Table<any>) => void;
} & TInitialState;

export type TActios =
  | { type: 'loading'; loading: boolean }
  | { type: 'initialize'; data: any[]; count: number }
  | { type: 'selection'; selectedRecords: any[] }
  | { type: 'update'; data: any[] }
  | { type: 'onlyFilter'; filters: any }
  | { type: 'filter'; filters: any; loading?: boolean }
  | { type: 'sort'; sorting: any[]; loading?: boolean }
  | { type: 'search'; search: string; loading?: boolean }
  | { type: 'pageChange'; page: number }
  | { type: 'pageSizeChange'; limit: number; loading?: boolean }
  | { type: 'complete' }
  | { type: 'error'; error: boolean }
  | { type: 'showFilteredRecordsOnly' }
  | { type: 'hiddenColumns'; hiddenColumns: boolean }
  | { type: 'setVisibleColumns'; visibleColumns: { [key: string]: boolean } }
  | { type: 'setColumnOrder'; columnOrder: ((data: string[]) => string[]) | string[] }
  | { type: 'setColumnSizes'; sizes: { [key: string]: number } | null }
  | { type: 'setCustomExpanderRowData'; data: { [key: string]: boolean } | null | 'all' };

type UseTableReducerProps = {
  renderedFrom?: string;
};

export const useTableReducer = (props?: UseTableReducerProps) => {
  const {
    state: { user }
  }: any = useData();
  const { renderedFrom } = props || {};
  const [selectedSubItemsMap, setSelectedSubItemsMap] = useState<Map<string, Map<string, any>>>(new Map());
  const tableRef = useRef<Table<any>>(null);

  const rowsPerPage = renderedFrom
    ? user?.gridRowsPerPage?.find((d) => d.resource === renderedFrom)?.rowsPerPage || gridPageSizes[0]
    : gridPageSizes[0];

  const newInitialState = {
    ...intialState,
    limit: rowsPerPage
  };

  const selectedCustomSubRows = useMemo(() => {
    const data = Array.from(selectedSubItemsMap.values())
      .flatMap((innerMap) => Array.from(innerMap.values()))
      .flat() as any[];
    return data;
  }, [selectedSubItemsMap]);

  const getTable = useCallback(() => {
    return tableRef.current;
  }, []);

  const setTable = useCallback((table: Table<any>) => {
    tableRef.current = table;
  }, []);

  const [state, dispatch] = useReducer(reducer, newInitialState as any);

  return { state: { ...state, getTable, setTable, selectedSubItemsMap, setSelectedSubItemsMap, selectedCustomSubRows }, dispatch };
};
