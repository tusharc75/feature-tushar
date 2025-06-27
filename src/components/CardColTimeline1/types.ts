import { CancelToken } from 'axios';
import { GridViewSavedData } from 'src/components/CustomReactTable/ArrangeView';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

export type SelectedView =
  | GridViewSavedData
  | {
      _id: string;
      hide: string[];
      order: string[];
      sizes: {
        [key: string]: number;
      };
      name?: string;
      id?: string;
    };

export type UseCardColState<D, C extends readonly string[]> = {
  columns: C;
  resetSelectionSignal: boolean;
  visibleColumns: C[number][];
  limit: number;
  columnDef: TColType[];
  filterQuery: string;
  refreshSignal: boolean;
  defaultVisibleRows: number;
  order: string[] | null;
  visible: Record<string, boolean>;
  selectedView: SelectedView | null;
  selectedRecordObj: Partial<Record<C[number], D[]>>;
};

export type UseCardColActions<D, C extends readonly string[]> =
  | { type: 'resetSelection' }
  | { type: 'setSelectedRecordObj'; payload: UseCardColState<D, C>['selectedRecordObj'] }
  | { type: 'setStateData'; payload: Partial<UseCardColState<D, C>> }
  | { type: 'setColumns'; payload: UseCardColState<D, C>['columns'] }
  | { type: 'setColumnDef'; payload: UseCardColState<D, C>['columnDef'] }
  | { type: 'setVisibleColumns'; payload: UseCardColState<D, C>['visibleColumns'] }
  | { type: 'setRefreshSignal'; payload: UseCardColState<D, C>['refreshSignal'] }
  | { type: 'setDefaultVisibleRows'; payload: UseCardColState<D, C>['defaultVisibleRows'] }
  | { type: 'setSelectedView'; payload: UseCardColState<D, C>['selectedView'] }
  | { type: 'setLimit'; payload: UseCardColState<D, C>['limit'] };

export type FetchSingleColumnReturnType<D> = {
  data: D[];
  count: number;
};

export type ColumnColor = {
  color: string;
  background: string;
  indicatorBackground: string;
  indicatorColor: string;
};

export type UseCardColTimelineProps<D, C extends readonly string[]> = {
  columns: C;
  initialVisibleColumns: C[number][];
  columnDef?: TColType[];
  fetchSingleColumn: (props: FetchSingleColumnProps<D, C>) => Promise<FetchSingleColumnReturnType<D>>;
  keyGetter: (data: D) => string;
};

export type FetchSingleColumnProps<D, C extends readonly string[]> = {
  column: UseCardColState<D, C>['columns'][number];
  page: number;
  filterQuery: UseCardColState<D, C>['filterQuery'];
  limit: number;
  cancelToken?: CancelToken;
};

export type UseCardColTimeline<D, C extends readonly string[]> = {
  setColumns: (payload: C) => void;
  setVisibleColumns: (payload: UseCardColState<D, C>['visibleColumns']) => void;
  refreshAllColumns: () => void;
  setLimit: (payload: UseCardColState<D, C>['limit']) => void;
  setColumnDef: (payload: UseCardColState<D, C>['columnDef']) => void;
  setDefaultVisibleRows: (num: UseCardColState<D, C>['defaultVisibleRows']) => void;
  setFilterQuery: (payload: UseCardColState<D, C>['filterQuery']) => void;
  keyGetter: (data: D) => string;
  fetchSingleColumn: (props: FetchSingleColumnProps<D, C>) => Promise<FetchSingleColumnReturnType<D>>;
  setState: React.Dispatch<UseCardColActions<D, C>>;
  setOrderAndVisibility: (props: { order: string[]; visible: Record<string, boolean> }) => void;
  setSelectedView: (payload: UseCardColState<D, C>['selectedView']) => void;
  resetSelection: () => void;
  selectedRecords: D[];
} & UseCardColState<D, C>;

export type CardColTimelineProps<D, C extends readonly string[]> = {
  state: UseCardColTimeline<D, C>;

  getColColors: (col: C[number]) => ColumnColor;
  cardOnClick?: (data: D) => void;
  passFailStatus?: boolean;
  passFailAccessor?: string;
};
