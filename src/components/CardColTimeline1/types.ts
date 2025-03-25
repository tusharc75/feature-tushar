import { useCardColTimeline } from 'src/components/CardColTimeline1/useCardColTimeline';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

export type UseCardColState<D, C extends readonly string[]> = {
  data: Partial<Record<C[number], D[]>>;
  columns: C;
  visibleColumns: C[number][];
  selectedRecordsObj: Record<string, boolean>;
  count: Record<C[number], number>;
  loading: Record<C[number], boolean>;
  page: Record<C[number], number>;
  limit: number;
  columnDef: TColType[];
  filterQuery: string;
  refreshSignal: boolean;
  defaultVisibleRows: number;
};

export type UseCardColActions<D, C extends readonly string[]> =
  | { type: 'setStateData'; payload: Partial<UseCardColState<D, C>> }
  | { type: 'setData'; payload: UseCardColState<D, C>['data'] }
  | { type: 'setColumns'; payload: UseCardColState<D, C>['columns'] }
  | { type: 'setColumnDef'; payload: UseCardColState<D, C>['columnDef'] }
  | { type: 'setVisibleColumns'; payload: UseCardColState<D, C>['visibleColumns'] }
  | { type: 'setSelectedRecordsObj'; payload: UseCardColState<D, C>['selectedRecordsObj'] }
  | { type: 'setLoading'; payload: UseCardColState<D, C>['loading'] }
  | { type: 'setRefreshSignal'; payload: UseCardColState<D, C>['refreshSignal'] }
  | { type: 'setDefaultVisibleRows'; payload: UseCardColState<D, C>['defaultVisibleRows'] }
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

export type InitProps<D, C extends readonly string[]> = {
  columns: UseCardColState<D, C>['columns'];
  initialVisibleColumns: UseCardColState<D, C>['visibleColumns'];
  columnDef?: UseCardColState<D, C>['visibleColumns'];
  fetchSingleColumn: (props: FetchSingleColumnProps<D, C>) => Promise<FetchSingleColumnReturnType<D>>;
};

export type FetchSingleColumnProps<D, C extends readonly string[]> = {
  column: UseCardColState<D, C>['columns'][number];
  page: number;
  filterQuery: UseCardColState<D, C>['filterQuery'];
  limit: number;
};

export type UseCardColTimeline<D, C extends readonly string[]> = {
  selectedRecords: string[];
  handleFetchSingleColumnWrapper: (column: UseCardColState<D, C>['columns'][number], page?: number) => Promise<void>;
  setData: (props: { column: UseCardColState<D, C>['columns'][number]; data: D[]; page: number; count?: number; pushData?: boolean }) => void;
  setColumns: (payload: UseCardColState<D, C>['columns']) => void;
  setVisibleColumns: (payload: UseCardColState<D, C>['visibleColumns']) => void;
  handleSelect: (id: string) => void;
  setLoading: ({ column, loading }: { column: UseCardColState<D, C>['columns'][number]; loading: boolean }) => void;
  setLimit: (payload: UseCardColState<D, C>['limit']) => void;
  setColumnDef: (payload: UseCardColState<D, C>['columnDef']) => void;
  setFilterQuery: (payload: UseCardColState<D, C>['filterQuery']) => void;
  setState: React.Dispatch<UseCardColActions<D, C>>;
  setDefaultVisibleRows: (num: UseCardColState<D, C>['defaultVisibleRows']) => void;
  refreshAllColumns: () => void;
} & UseCardColState<D, C>;

export type CardColTimelineProps<D, C extends string[]> = {
  state: UseCardColTimeline<D, C>;
  keyGetter: (data: D) => string;
  getColor: (col: C[number]) => ColumnColor;
  cardOnClick?: (data: D) => void;
  passFailStatus?: boolean;
  passFailAccessor?: string;
};
