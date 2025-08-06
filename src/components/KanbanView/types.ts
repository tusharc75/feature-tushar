import { ColumnDef } from '@tanstack/react-table';
import { CancelToken } from 'axios';

export type InitialState<D> = {
  columns: Column<D>[];
  pivotColumn: Column<D>;
};

export type Column<D> = {
  id?: string;
  Header?: string | (() => string);
  Cell?: (d: any) => any;
  lockPosition?: boolean;
  fieldName?: string;
  fieldLabel?: string;
  required?: boolean;
  unique?: boolean;
  type?: string;
  isTooltip?: boolean;
  order?: number;
  editAble?: boolean;
  disableOnEdit?: boolean;
  hiddenField?: boolean;
  isDropdown?: boolean;
  isWarningTooltip?: boolean;
  lookup?: boolean;
  lookupResource?: string;
  warningTooltipMessage?: string;
  primaryField?: boolean;
  resource?: 'Opportunity';
  brand?: '630dbe1e9ec418610523529c';
  roleType?: number;
  dataList?: boolean;
  dataListId?: string;
  entityWiseLookup?: boolean;
  formula?: string;
  formulaFields?: any[];
  formulainputFields?: any[];
  htmlDescription?: string;
  inputFields?: any[];
  isColumnEditable?: boolean;
  isFieldEntityWise?: boolean;
  isHideColumnSum?: boolean;
  isMinMaxValue?: boolean;
  isSystemGenerate?: boolean;
  isUneditable?: boolean;
  maxValue?: number;
  maxValueServiceAdd?: string;
  minValue?: number;
  minValueServiceAdd?: string;
  preFilters?: any[];
  showInPdf?: boolean;
  stopHideColumn?: boolean;
  subFields?: any[];
  systemGeneratedPrefix?: string;
  visibilityCondition?: any[];
  columnSize?: number;
  counterFieldInputFields?: any[];
  dateValidation?: any[];
  enableServicesAddOnBasedOnValue?: boolean;
  lookupPreFilterFields?: any[];
  operationOnLineItems?: string;
  requiredDependentOn?: any[];
  restrictBackDate?: boolean;
  restrictCurrentDateAutoSelect?: boolean;
  restrictFutureDate?: boolean;
  servicesAddOnBasedOnValue?: any[];
  showTotalInCard?: boolean;
  currency?: 'USD';
  accessorKey?: string;
  accessor?: string;
  minWidth?: number;
  width?: number;
  show?: boolean;
  decimalPlaces?: number;
  disabled?: boolean;
  editable?: boolean;
  option?: Option[];
  tooltipMessage?: string;
  deletAble?: boolean;
  addManualOptionInExcel?: boolean;
  addAdditionalOption?: boolean;
  disableFilters?: boolean;
  addBulkOptions?: boolean;
  disableSortBy?: boolean;
  lookupDependentOn?: string;
  showAdditionalInfoPopup?: boolean;
  isDependentDropdown?: boolean;
  dropdowDependentOn?: string;
  size?: number;
  minSize?: number;
  sticky?: string;
  canDrag?: boolean;
} & ColumnDef<D>;

export type DefaultValue = '' | 'New';

export type Option = {
  optionLabel?: string;
  optionValue?: string;
  order?: number;
  default?: boolean;
  id?: number;
  outcome?: string;
};

export type CanbanViewState<D> = {
  selectedRrowsMap: Map<string, D>;
  search: string;
  deepFiltersOriginal: DeepFilter[];
  filterByIdsOriginal: FilterByID[];
  filterTerm: FilterTerm;
  deepFilters: any[];
  filterByIds: any[];
  resourceColumns: any[];
  order: string[];
  visible: Record<string, boolean>;
};

export type FetchCanbanDataPayload = { column: string; page: number; limit: number; cancelToken?: CancelToken };
export type FetchCanbanData<D> = (payload: FetchCanbanDataPayload) => Promise<{ data: D[]; count: number }>;

type KanbanStateKeys<D> = keyof CanbanViewState<D>;
type KanbanTableKeys<D, K extends KanbanStateKeys<D>> = CanbanViewState<D>[K];

type ActionMap<D> = {
  [K in KanbanStateKeys<D> as `set${Capitalize<string & K>}`]: {
    type: `set${Capitalize<string & K>}`;
    payload: KanbanTableKeys<D, K>;
  };
};

export type Actions<D> = ActionMap<D>[keyof ActionMap<D>];
export type ActionPayloadMap<D> = {
  [A in Actions<D> as A['type']]: A['payload'];
};

export type UseCanbanStore<D> = {
  selectedRows: D[];
  dispatch: React.Dispatch<Actions<D>>;
  handleSelect: (data: D) => void;
  handleOnDelete: (data: D) => void;
  handleClearSelection: () => void;
  handleSelectMultiple: (data: D[]) => void;
  handleUnSelectMultiple: (data: D[]) => void;
  setState: <K extends keyof ActionPayloadMap<D>>(type: K, payload: ActionPayloadMap<D>[K]) => void;
} & CanbanViewState<D>;

export type DeepFilter = {
  field?: string;
  term?: string[] | DateRange | 'Yes' | 'No';
  duration?: string;
  type?: string;
};

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type FilterByID = {
  field?: string;
  term?: TermElement[];
};

export type TermElement = {
  optionValue?: string;
  optionLabel?: string;
  order?: number;
  default?: boolean;
};

export type FilterTerm = Record<string, '$nin' | '$in'>;
